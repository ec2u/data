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

package eu.ec2u.data.datasets.taxonomies;

import com.metreeca.flow.Xtream;
import com.metreeca.flow.json.actions.Validate;
import com.metreeca.mesh.meta.jsonld.Class;
import com.metreeca.mesh.meta.jsonld.Frame;
import com.metreeca.mesh.meta.jsonld.Namespace;

import eu.ec2u.data.datasets.Reference;
import eu.ec2u.data.datasets.Resource;
import eu.ec2u.data.vocabularies.skos.SKOSConcept;
import eu.ec2u.work.ai.Embedder;
import eu.ec2u.work.ai.StoreEmbedder;
import eu.ec2u.work.ai.Vector;

import java.util.*;
import java.util.stream.Stream;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.shim.Collections.*;

import static eu.ec2u.data.datasets.Localized.EN;
import static eu.ec2u.work.ai.Embedder.embedder;
import static java.util.function.Predicate.not;

@Frame
@Class
@Namespace("[ec2u]")
public interface Topic extends Resource, SKOSConcept {

    static Optional<TopicFrame> review(final TopicFrame topic) {

        if ( topic == null ) {
            throw new NullPointerException("null topic");
        }

        return Optional.of(topic)
                .map(Topic::index)
                .flatMap(new Validate<>());
    }


    private static TopicFrame index(final TopicFrame topic) {

        if ( topic == null ) {
            throw new NullPointerException("null topic");
        }

        final StoreEmbedder embedder=new StoreEmbedder(service(embedder()));

        return Optional.ofNullable(embeddable(topic))
                .filter(not(String::isBlank))
                .flatMap(embedder::embed)
                .map(Vector::encode)
                .map(topic::embedding)
                .orElse(topic);
    }

    private static String embeddable(final Topic topic) {
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
    default Taxonomy dataset() {
        return inScheme();
    }


    @Override
    Taxonomy inScheme();

    @Override
    Taxonomy topConceptOf();


    @Override
    Set<Topic> broader();

    @Override
    default Set<Topic> broaderTransitive() {
        return set(Stream.concat(
                broader().stream(),
                broader().stream().flatMap(c -> c.broaderTransitive().stream())
        ));
    }

    @Override
    Set<Topic> narrower();

    @Override
    Set<Topic> related();

    @Override
    Set<Topic> exactMatch();

}
