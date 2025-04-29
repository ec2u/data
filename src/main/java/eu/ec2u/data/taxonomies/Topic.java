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

import com.metreeca.flow.work.Xtream;
import com.metreeca.mesh.meta.jsonld.Frame;
import com.metreeca.mesh.meta.jsonld.Namespace;

import eu.ec2u.data.EC2U;
import eu.ec2u.data.resources.Reference;
import eu.ec2u.data.resources.Resource;
import eu.ec2u.work.ai.Embedder;
import eu.ec2u.work.ai.StoreEmbedder;
import eu.ec2u.work.ai.Vector;

import java.util.Collection;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.mesh.util.Collections.entry;
import static com.metreeca.mesh.util.Collections.map;

import static eu.ec2u.data.resources.Localized.EN;
import static eu.ec2u.work.ai.Embedder.embedder;
import static java.util.function.Predicate.not;

@Frame
@Namespace("[ec2u]")
public interface Topic extends Resource, SKOSConcept<Taxonomy, Topic> {

    static TopicFrame index(final TopicFrame topic) {

        if ( topic == null ) {
            throw new NullPointerException("null topic");
        }

        return Optional.ofNullable(embeddable(topic))
                .filter(not(String::isBlank))
                .flatMap(new StoreEmbedder(service(embedder())).partition(EC2U.EMBEDDINGS))
                .map(Vector::encode)
                .map(topic::embedding)
                .orElse(topic);
    }

    static String embeddable(final Topic topic) {
        return Embedder.embeddable(Xtream.from(
                Optional.ofNullable(topic.prefLabel().get(EN)).stream(),
                Optional.ofNullable(topic.altLabel().get(EN)).stream().flatMap(Collection::stream),
                Optional.ofNullable(topic.hiddenLabel().get(EN)).stream().flatMap(Collection::stream),
                Optional.ofNullable(topic.definition().get(EN)).stream()
        ));
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

}
