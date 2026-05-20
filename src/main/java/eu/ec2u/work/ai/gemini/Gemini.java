/*
 * Copyright © 2020-2025 EC2U Alliance
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package eu.ec2u.work.ai.gemini;

import com.metreeca.flow.services.Logger;

import com.google.genai.Client;
import com.google.genai.errors.ApiException;
import eu.ec2u.work.Throttle;

import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Consumer;
import java.util.function.Supplier;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.services.Logger.logger;

import static java.lang.String.format;

/**
 * Google Gemini client wrapper with adaptive rate limiting and retry capabilities.
 *
 * <p>Provides a thread-safe wrapper around the Google Gen AI Java client that automatically
 * handles rate limiting using per-model adaptive rate limiters. Implements exponential backoff with jitter to
 * gracefully handle API rate limits while optimizing throughput.</p>
 *
 * <p>Unlike the OpenAI client, the Gen AI SDK does not expose response headers on its exceptions, so retry delays are
 * derived solely from the adaptive limiter. HTTP {@code 429} ({@code RESOURCE_EXHAUSTED}) covers both transient
 * rate-limiting and permanent quota/billing exhaustion: the former is retried with adaptive backoff, while the latter
 * is detected from the flattened error message and propagated immediately, mirroring the OpenAI
 * {@code insufficient_quota} abort.</p>
 *
 * @see <a href="https://ai.google.dev/gemini-api">Gemini API</a>
 * @see <a href="https://github.com/googleapis/java-genai">Google Gen AI Java SDK</a>
 */
public final class Gemini {

    /**
     * Retrieves the default Gemini factory.
     *
     * @return the default Gemini factory, which throws an exception reporting the service as undefined
     */
    public static Supplier<Gemini> gemini() {
        return () -> { throw new IllegalStateException("undefined Gemini service"); };
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final Client client;

    private final Logger logger=service(logger());

    private final Map<String, Throttle<?>> throttles=new ConcurrentHashMap<>();


    /**
     * Creates a Gemini client with the specified API key.
     *
     * @param key the Gemini API key
     *
     * @throws NullPointerException if key is {@code null}
     */
    public Gemini(final String key) {
        this(key, builder -> { });
    }

    /**
     * Creates a Gemini client with the specified API key and custom configuration.
     *
     * @param key   the Gemini API key
     * @param setup consumer to customize the client builder
     *
     * @throws NullPointerException if either key or setup is {@code null}
     */
    public Gemini(final String key, final Consumer<Client.Builder> setup) {

        if ( key == null ) {
            throw new NullPointerException("null key");
        }

        if ( setup == null ) {
            throw new NullPointerException("null setup");
        }

        final Client.Builder builder=Client.builder().apiKey(key);

        setup.accept(builder);

        this.client=builder.build();
    }

    /**
     * Retrieves the underlying Gen AI client.
     *
     * @return the Gen AI client instance
     */
    public Client client() {
        return client;
    }


    /**
     * Executes a task with adaptive rate limiting and retry logic.
     *
     * <p>Automatically retries the task on rate limit exceptions using per-model
     * adaptive rate limiters. The limiter adjusts delays based on success/failure patterns to optimize throughput while
     * respecting API limits.</p>
     *
     * @param <V>      the return type of the task
     * @param model    the Gemini model name for rate limiting scope
     * @param attempts maximum retry attempts (0 for unlimited)
     * @param task     the task to execute
     *
     * @return the task result
     *
     * @throws NullPointerException     if either {@code  model} or {@code task} is {@code null}
     * @throws IllegalArgumentException if {@code attempts} is negative
     * @throws ApiException             if the request fails with a non-rate-limit error, hits permanent quota/billing
     *                                  exhaustion, or is aborted after reaching the attempt limit
     * @see <a href="https://ai.google.dev/gemini-api/docs/rate-limits">Rate limits</a>
     */
    public <V> V retry(final String model, final int attempts, final Supplier<V> task) {

        if ( model == null ) {
            throw new NullPointerException("null model");
        }

        if ( attempts < 0 ) {
            throw new IllegalArgumentException(format("negative attempt limit <%d>", attempts));
        }

        if ( task == null ) {
            throw new NullPointerException("null task");
        }

        final Throttle<?> throttle=throttles.computeIfAbsent(model, key -> new Throttle<>()
                .minimum(100)
                .maximum(60*1000)
                .buildup(1.10)
                .backoff(1.10)
                .recover(0.95)
        );

        for (int attempt=0; attempts == 0 || attempt < attempts; attempt++) {
            try {

                final long delay=throttle.await();

                logger.info(this, format(
                        "request attempt <%d> submitted with delay <%,d> ms", attempt+1, delay
                ));

                final V value=task.get();

                throttle.adapt(true);

                return value;

            } catch ( final ApiException e ) {

                if ( e.code() != 429 || quota(e) ) {
                    throw e;
                }

                final long delay=throttle.adapt(false);

                logger.warning(this, format(
                        "request attempt <%d> rejected with delay <%,d> ms", attempt+1, delay
                ));

            }
        }

        throw new ApiException(429, "RESOURCE_EXHAUSTED", format(
                "request aborted after <%,d> attempts", attempts
        ));

    }


    /**
     * Tests whether a {@code 429} signals permanent quota/billing exhaustion rather than transient rate limiting.
     *
     * <p>The Gen AI SDK flattens the {@code error.details} objects into the exception message, so detection is
     * string-based: a per-day quota cap ({@code quotaId} containing {@code PerDay}) will not clear within a run, and
     * the no-billing/zero-quota case (<i>check your plan and billing details</i>) is permanent unless it carries a
     * {@code RetryInfo} retry delay, which marks it as transient.</p>
     *
     * @param e the rejected request exception
     *
     * @return {@code true} if {@code e} should be propagated immediately instead of retried
     */
    private static boolean quota(final ApiException e) {

        final String text=(e.message() == null ? "" : e.message()).toLowerCase(Locale.ROOT);

        return text.contains("perday")
                || text.contains("check your plan and billing details") && !text.contains("retrydelay");
    }

}
