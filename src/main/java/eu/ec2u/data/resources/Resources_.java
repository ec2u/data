/*
 * Copyright © 2020-2024 EC2U Alliance
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

package eu.ec2u.data.resources;

import org.eclipse.rdf4j.model.Literal;
import org.eclipse.rdf4j.model.Value;

import java.util.stream.Stream;

import static com.metreeca.link.Frame.literal;

import static java.util.function.Predicate.not;

public final class Resources_ {

    public static Stream<Literal> localized(final Stream<Value> values, final String language) {

        if ( values == null ) {
            throw new NullPointerException("null values");
        }

        return values
                .filter(Value::isLiteral)
                .map(Literal.class::cast)
                .filter(not(v -> v.stringValue().isBlank()))
                .map(v -> literal(v.stringValue(), v.getLanguage().orElse(language)));
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Resources_() { }

}
