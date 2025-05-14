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

import com.openai.client.OpenAIClient;
import com.openai.client.okhttp.OpenAIOkHttpClient;
import com.openai.errors.OpenAIException;
import com.openai.errors.RateLimitException;

import java.util.concurrent.ThreadLocalRandom;
import java.util.function.Consumer;
import java.util.function.Supplier;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.services.Logger.logger;
import static com.metreeca.shim.Lambdas.lenient;

import static java.lang.Math.min;
import static java.lang.String.format;

/**
 * @see <a href="https://openai.com/api/">OpenAI Platform</a>
 * @see <a href="https://github.com/openai/openai-java">OpenAI Java API Library</a>
 */
public final class OpenAI {

    private static final long MIN_DELAY=100;
    private static final long MAX_DELAY=5*60_000;


    /**
     * Retrieves the default OpenAI client factory.
     *
     * @return the default OpenAI client factory, which throws an exception reporting the service as undefined
     */
    public static Supplier<OpenAIClient> openai() {
        return () -> { throw new IllegalStateException("undefined OpenAI client service"); };
    }


    public static OpenAIClient openai(final String key) {

        if ( key == null ) {
            throw new NullPointerException("null key");
        }

        return openai(key, client -> { });
    }

    public static OpenAIClient openai(final String key, final Consumer<OpenAIOkHttpClient.Builder> setup) {

        if ( key == null ) {
            throw new NullPointerException("null key");
        }

        if ( setup == null ) {
            throw new NullPointerException("null setup");
        }

        final OpenAIOkHttpClient.Builder builder=OpenAIOkHttpClient.builder().apiKey(key);

        setup.accept(builder);

        return builder.build();
    }


    /*
     * @see <a href="https://platform.openai.com/docs/guides/rate-limits#error-mitigation">Rate limits - Error mitigation</a>
     */
    static <V> V backoff(final int attempts, final Supplier<V> task) {

        if ( attempts < 0 ) {
            throw new IllegalArgumentException(format("negative attempt limit <%d>", attempts));
        }

        if ( task == null ) {
            throw new NullPointerException("null task");
        }

        for (int attempt=0; attempts == 0 || attempt < attempts; attempt++) {
            try {

                return task.get();

            } catch ( final RateLimitException e ) {

                try {

                    final long minimum=e.headers()
                            .values("retry-after-ms")
                            .stream()
                            .findFirst()
                            .flatMap(lenient(Long::parseLong))
                            .orElse(MIN_DELAY);

                    final long maximum=minimum+min(minimum*(1L << min(attempt, 30)), MAX_DELAY);// prevent overflow
                    final long delay=ThreadLocalRandom.current().nextLong(minimum, maximum);

                    service(logger()).warning(OpenAI.class, format(
                            "task delayed by <%,d> ms after <%,d> attempts", delay, attempt+1
                    ));

                    Thread.sleep(delay);

                } catch ( final InterruptedException ignored ) {

                    Thread.currentThread().interrupt();

                }

            }
        }

        throw new OpenAIException(format("request aborted after <%,d> attempts", attempts));

    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private OpenAI() { }

}
