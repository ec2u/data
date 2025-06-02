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

package eu.ec2u.work.ai;

import com.metreeca.flow.services.Logger;

import com.openai.client.OpenAIClient;
import com.openai.client.okhttp.OpenAIOkHttpClient;
import com.openai.errors.OpenAIException;
import com.openai.errors.RateLimitException;
import eu.ec2u.work.Throttle;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Consumer;
import java.util.function.Supplier;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.services.Logger.logger;
import static com.metreeca.shim.Lambdas.lenient;
import static com.metreeca.shim.Streams.optional;

import static java.lang.String.format;

/**
 * OpenAI client wrapper with adaptive rate limiting and retry capabilities.
 *
 * <p>Provides a thread-safe wrapper around the OpenAI Java client that automatically
 * handles rate limiting using per-model adaptive rate limiters. Implements exponential backoff with jitter to
 * gracefully handle API rate limits while optimizing throughput.</p>
 *
 * @see <a href="https://openai.com/api/">OpenAI Platform</a>
 * @see <a href="https://github.com/openai/openai-java">OpenAI Java API Library</a>
 */
public final class OpenAI {

    /**
     * Retrieves the default OpenAI factory.
     *
     * @return the default OpenAI factory, which throws an exception reporting the service as undefined
     */
    public static Supplier<OpenAI> openai() {
        return () -> { throw new IllegalStateException("undefined OpenAI service"); };
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final OpenAIClient client;

    private final Logger logger=service(logger());


    /**
     * Creates an OpenAI client with the specified API key.
     *
     * @param key the OpenAI API key
     *
     * @throws NullPointerException if key is {@code null}
     */
    public OpenAI(final String key) {
        this(key, builder -> { });
    }

    /**
     * Creates an OpenAI client with the specified API key and custom configuration.
     *
     * @param key   the OpenAI API key
     * @param setup consumer to customize the client builder
     *
     * @throws NullPointerException if either key or setup is {@code null}
     */
    public OpenAI(final String key, final Consumer<OpenAIOkHttpClient.Builder> setup) {

        if ( key == null ) {
            throw new NullPointerException("null key");
        }

        if ( setup == null ) {
            throw new NullPointerException("null setup");
        }

        final OpenAIOkHttpClient.Builder builder=OpenAIOkHttpClient.builder().apiKey(key);

        setup.accept(builder);

        this.client=builder.build();
    }

    /**
     * Retrieves the underlying OpenAI client.
     *
     * @return the OpenAI client instance
     */
    public OpenAIClient client() {
        return client;
    }


    //̸// !!! //////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final Map<String, Throttle<?>> throttles=new ConcurrentHashMap<>();


    /**
     * Executes a task with adaptive rate limiting and retry logic.
     *
     * <p>Automatically retries the task on rate limit exceptions using per-model
     * adaptive rate limiters. The limiter adjusts delays based on success/failure patterns to optimize throughput while
     * respecting API limits.</p>
     *
     * @param <V>      the return type of the task
     * @param model    the OpenAI model name for rate limiting scope
     * @param attempts maximum retry attempts (0 for unlimited)
     * @param task     the task to execute
     *
     * @return the task result
     *
     * @throws NullPointerException     if either {@code  model} or {@code task} is {@code null}
     * @throws IllegalArgumentException if {@code attempts} is negative
     * @throws OpenAIException          if the request is aborted after reaching attempt limit
     * @see <a href="https://platform.openai.com/docs/guides/rate-limits#error-mitigation">Rate limits - Error
     *         mitigation</a>
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

        final Throttle<?> throttle=throttles.computeIfAbsent(model, key -> new Throttle<>());

        for (int attempt=0; attempts == 0 || attempt < attempts; attempt++) {
            try {

                final long delay=throttle.await();

                logger.info(this, format(
                        "request attempt <%d> submitted with delay <%,d> ms", attempt+1, delay
                ));

                final V value=task.get();

                throttle.adapt(true);

                return value;

            } catch ( final RateLimitException e ) {

                final long delay=e.headers().values("retry-after-ms").stream()
                        .flatMap(optional(lenient(Long::parseLong)))
                        .findFirst()
                        .map(throttle::adapt)
                        .orElseGet(() -> throttle.adapt(false));

                logger.warning(this, format(
                        "request attempt <%d> rejected with delay <%,d> ms", attempt+1, delay
                ));

            }
        }

        throw new OpenAIException(format(
                "request aborted after <%,d> attempts", attempts
        ));

    }

}
