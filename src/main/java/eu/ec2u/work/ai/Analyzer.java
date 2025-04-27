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

import com.metreeca.mesh.Value;

import java.util.Optional;
import java.util.function.Function;
import java.util.function.Supplier;

/**
 * Text analyzer.
 *
 * <p>Extracts structured information from texts according to plain language prompts.</p>
 */
@FunctionalInterface
public interface Analyzer {

    /**
     * Retrieves the default text analyzer factory.
     *
     * @return the default text analyzer factory, which throws an exception reporting the service as undefined
     */
    public static Supplier<Analyzer> analyzer() {
        return () -> { throw new IllegalStateException("undefined text analyzer service"); };
    }


    /**
     * Generates a text analyzer function.
     *
     * @param prompt the plain language textual analysis prompt
     *
     * @return a text analyzer function that extracts from a textual input a JSON value structured as seen fit
     *
     * @throws NullPointerException     if either {@code prompt} or {@code schema} is null
     * @throws IllegalArgumentException if {@code prompt} is empty
     */
    public default Function<String, Optional<Value>> prompt(final String prompt) {
        return prompt(prompt, "");
    }

    /**
     * Generates a text analyzer function.
     *
     * @param prompt the plain language textual analysis prompt
     * @param schema the expected JSON schema for the structured information extracted from the analysed text
     *
     * @return a text analyzer function that extracts from a textual input a JSON value structured according the
     *         provided {@code  schema}
     *
     * @throws NullPointerException     if either {@code prompt} o {@code schema} is null
     * @throws IllegalArgumentException if {@code prompt} is empty
     * @throws IllegalArgumentException if {@code schema} does not contain a valid JSON schema
     * @see <a href="https://json-schema.org/docs">JSON Schema</a>
     */
    public Function<String, Optional<Value>> prompt(final String prompt, final String schema);

}
