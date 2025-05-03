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

import com.metreeca.mesh.meta.jsonld.Class;
import com.metreeca.mesh.meta.jsonld.Frame;
import com.metreeca.mesh.meta.jsonld.Namespace;

import eu.ec2u.data.resources.Collection;
import eu.ec2u.work.CSVProcessor;
import org.apache.commons.csv.CSVRecord;

import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.stream.Stream;

import static com.metreeca.flow.toolkits.Strings.split;
import static com.metreeca.mesh.util.Collections.*;
import static com.metreeca.mesh.util.URIs.uri;

import static eu.ec2u.data.resources.Localized.EN;
import static java.lang.Math.max;
import static java.util.function.Predicate.not;

@Frame
@Class
@Namespace("[ec2u]")
public interface Taxonomy extends Collection, SKOSConceptScheme<Taxonomy, Topic> {

    @Override
    default Taxonomies collection() {
        return Taxonomies.TAXONOMIES;
    }

    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    final class Loader extends CSVProcessor<TopicFrame> {

        private static final Pattern NUMBER_PATTERN=Pattern.compile("\\d+");


        private final Taxonomy taxonomy;


        Loader(final Taxonomy taxonomy) {

            if ( taxonomy == null ) {
                throw new NullPointerException("null taxonomy");
            }

            this.taxonomy=taxonomy;
        }


        @Override protected Stream<TopicFrame> process(final CSVRecord record, final java.util.Collection<CSVRecord> records) {
            return value(record, "id").filter(not(String::isBlank))

                    .map(id -> {

                        final String parent=id.substring(0, max(id.lastIndexOf('/'), 0));

                        final Set<? extends Topic> broader=parent.isEmpty() ?
                                null : set(new TopicFrame(true).id(uri(taxonomy.id()+"/"+parent)));

                        final Set<? extends Topic> broaderTransitive=parent.isEmpty() ? null : set(records.stream()
                                .map(r -> value(r, "id", s -> Optional.of(s).filter(not(String::isBlank))))
                                .flatMap(Optional::stream)
                                .filter(b -> id.startsWith(b+"/"))
                                .sorted()
                                .map(b -> new TopicFrame(true).id(uri(taxonomy.id()+"/"+b)))
                        );

                        return new TopicFrame()

                                .id(uri(taxonomy.id()+"/"+id))

                                .inScheme(taxonomy)
                                .topConceptOf(parent.isBlank() ? taxonomy : null)

                                .notation(value(record, "notation")
                                        .or(() -> Optional.of(id).filter(NUMBER_PATTERN.asMatchPredicate()))
                                        .filter(not(String::isBlank))
                                        .orElse(null)
                                )

                                .prefLabel(value(record, "label")
                                        .filter(not(String::isBlank))
                                        .map(v -> map(entry(EN, v)))
                                        .orElse(null)
                                )

                                .altLabel(value(record, "alternative")
                                        .filter(not(String::isBlank))
                                        .map(v -> map(entry(EN, set(split(v, ";")))))
                                        .filter(not(Map::isEmpty))
                                        .orElse(null)
                                )

                                .hiddenLabel(value(record, "hidden")
                                        .filter(not(String::isBlank))
                                        .map(v -> map(entry(EN, set(split(v, ";")))))
                                        .filter(not(Map::isEmpty))
                                        .orElse(null)
                                )

                                .definition(value(record, "definition")
                                        .filter(not(String::isBlank))
                                        .map(v -> map(entry(EN, v)))
                                        .orElse(null)
                                )

                                .broader(broader)
                                .broaderTransitive(broaderTransitive);

                    })

                    .flatMap(Topic::review)
                    .stream();
        }

    }

}
