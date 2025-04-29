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
public interface Analyzer extends Function<String, Optional<Value>> {

    /**
     * Retrieves the default text analyzer factory.
     *
     * @return the default text analyzer factory, which throws an exception reporting the service as undefined
     */
    static Supplier<Analyzer> analyzer() {
        return () -> { throw new IllegalStateException("undefined text analyzer service"); };
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    default Analyzer prompt(final String prompt) {
        return prompt(prompt, "");
    }

    Analyzer prompt(final String prompt, final String schema);

}
