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

import static eu.ec2u.work.Work.guard;
import static java.lang.Math.min;
import static java.lang.String.format;

/**
 * @see <a href="https://openai.com/api/">OpenAI Platform</a>
 * @see <a href="https://github.com/openai/openai-java">OpenAI Java API Library</a>
 */
public final class OpenAI {

    private static final int MIN_DELAY=100;
    private static final int MAX_DELAY=10_000;


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


    //

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

                    final int exponent=attempt;

                    final long delay=e.headers()
                            .values("retry-after-ms")
                            .stream()
                            .findFirst()
                            .map(guard(Long::parseLong))
                            .orElseGet(() -> min(MIN_DELAY*(1L << min(exponent, 30)), MAX_DELAY)); // prevent overflow

                    final long jitter=ThreadLocalRandom.current().nextLong(0, delay);

                    Thread.sleep(delay+jitter);

                } catch ( final InterruptedException ignored ) { }

            }
        }

        throw new OpenAIException(format("request aborted after <%d> attempts", attempts));

    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private OpenAI() { }

}
