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

import com.metreeca.flow.json.actions.Validate;
import com.metreeca.flow.work.Xtream;
import com.metreeca.mesh.meta.jsonld.Frame;
import com.metreeca.mesh.meta.jsonld.Namespace;

import eu.ec2u.data.resources.Reference;
import eu.ec2u.data.resources.Resource;
import eu.ec2u.work.CSVProcessor;
import eu.ec2u.work.ai.Embedder;
import eu.ec2u.work.ai.StoreEmbedder;
import eu.ec2u.work.ai.Vector;
import org.apache.commons.csv.CSVRecord;

import java.util.*;
import java.util.regex.Pattern;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.toolkits.Strings.split;
import static com.metreeca.mesh.util.Collections.*;
import static com.metreeca.mesh.util.URIs.uri;

import static eu.ec2u.data.EC2U.EMBEDDINGS;
import static eu.ec2u.data.resources.Localized.EN;
import static eu.ec2u.work.ai.Embedder.embedder;
import static java.lang.Math.max;
import static java.util.function.Predicate.not;

@Frame
@Namespace("[ec2u]")
public interface Topic extends Resource, SKOSConcept<Taxonomy, Topic> {

    static Optional<TopicFrame> review(final TopicFrame topic) {

        if ( topic == null ) {
            throw new NullPointerException("null topic");
        }

        return Optional.of(topic)
                .map(Topic::index)
                .flatMap(new Validate<>());
    }


    static TopicFrame index(final TopicFrame topic) {

        if ( topic == null ) {
            throw new NullPointerException("null topic");
        }

        final StoreEmbedder embedder=new StoreEmbedder(service(embedder())).partition(EMBEDDINGS);

        return Optional.ofNullable(embeddable(topic))
                .filter(not(String::isBlank))
                .flatMap(embedder::embed)
                .map(Vector::encode)
                .map(topic::embedding)
                .orElse(topic);
    }

    static String embeddable(final Topic topic) {
        return Embedder.embeddable(set(Xtream.from(
                Optional.ofNullable(topic.prefLabel().get(EN)).stream(),
                Optional.ofNullable(topic.altLabel().get(EN)).stream().flatMap(Collection::stream),
                Optional.ofNullable(topic.hiddenLabel().get(EN)).stream().flatMap(Collection::stream),
                Optional.ofNullable(topic.definition().get(EN)).stream()
        )));
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

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


        @Override protected Optional<TopicFrame> process(final CSVRecord record, final Collection<CSVRecord> records) {
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

                    .flatMap(Topic::review);
        }

    }
}
