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

package eu.ec2u.data.taxonomies;

import com.metreeca.mesh.meta.jsonld.Frame;
import com.metreeca.mesh.meta.jsonld.Namespace;

import eu.ec2u.data.resources.Reference;
import eu.ec2u.data.resources.Resource;

import java.util.Locale;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Stream;

import static com.metreeca.mesh.util.Collections.entry;
import static com.metreeca.mesh.util.Collections.map;

import static java.util.function.Predicate.not;
import static java.util.function.UnaryOperator.identity;
import static java.util.stream.Collectors.*;

@Frame
@Namespace("[ec2u]")
public interface Topic extends Resource, SKOSConcept<Taxonomy, Topic> {

    @Override
    default Map<Locale, String> label() {
        return Reference.label(Optional.ofNullable(notation())
                .filter(not(String::isEmpty))
                .map(notation -> map(prefLabel().entrySet().stream().map(e ->
                        entry(e.getKey(), "%s - %s".formatted(notation, e.getValue()))
                )))
                .orElseGet(this::prefLabel)
        );
    }

    @Override
    default Map<Locale, String> comment() {
        return Reference.comment(definition());
    }

    @Override
    default Taxonomy collection() {
        return inScheme();
    }


    @Override
    default Map<Locale, Set<String>> indexed() {
        return map(Stream

                .of(
                        prefLabel().entrySet().stream(),
                        altLabel().entrySet().stream().flatMap(e ->
                                e.getValue().stream().map(v -> entry(e.getKey(), v))
                        ),
                        hiddenLabel().entrySet().stream().flatMap(e ->
                                e.getValue().stream().map(v -> entry(e.getKey(), v))
                        )
                )

                .flatMap(identity())
                .collect(groupingBy(Entry::getKey, mapping(
                        e -> e.getValue().toLowerCase(Locale.ROOT),
                        toSet()
                )))

        );
    }

}
