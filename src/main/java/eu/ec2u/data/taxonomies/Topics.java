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

import com.metreeca.mesh.Valuable;
import com.metreeca.mesh.meta.jsonld.Frame;
import com.metreeca.mesh.meta.jsonld.Id;
import com.metreeca.mesh.meta.jsonld.Virtual;

import eu.ec2u.data.resources.Collection;
import eu.ec2u.work.ai.StoreEmbedder;
import eu.ec2u.work.ai.Vector;

import java.net.URI;
import java.util.Arrays;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Stream;

import static com.metreeca.flow.Locator.service;

import static eu.ec2u.data.EC2U.DATA;
import static eu.ec2u.work.ai.Embedder.embedder;
import static java.lang.String.format;
import static java.util.function.Predicate.not;

@Frame
@Virtual
public interface Topics extends Collection {

    URI TOPICS=DATA.resolve("topics/");


    static Stream<Valuable> index(final TopicFrame... topics) {

        if ( topics == null ) {
            throw new NullPointerException("null topics");
        }

        return Arrays.stream(topics).map(Topics::index);
    }

    static Stream<Valuable> index(final java.util.Collection<TopicFrame> topics) {

        if ( topics == null ) {
            throw new NullPointerException("null topics");
        }

        return topics.stream().map(Topics::index);
    }

    static TopicFrame index(final TopicFrame topic) {

        if ( topic == null ) {
            throw new NullPointerException("null topic");
        }

        return Optional.ofNullable(topic.embeddable())
                .filter(not(String::isBlank))
                .flatMap(new StoreEmbedder(service(embedder())).partition(TOPICS.resolve("~embeddings")))
                .map(vector -> topic.embedding(Vector.encode(vector)))
                .orElse(topic);
    }


    static Optional<Topic> resolve(final URI taxonomy, final String label) {

        if ( taxonomy == null ) {
            throw new NullPointerException("null taxonomy");
        }

        if ( label == null ) {
            throw new NullPointerException("null label");
        }

        return TopicsResolver.resolve(taxonomy, label);
    }

    static Stream<Topic> match(final URI taxonomy, final String query, final double threshold) {

        if ( taxonomy == null ) {
            throw new NullPointerException("null taxonomy");
        }

        if ( query == null ) {
            throw new NullPointerException("null query");
        }

        if ( threshold < 0 ) {
            throw new IllegalArgumentException(format("negative threshold <%.3f>", threshold));
        }

        return TopicsMatcher.match(taxonomy, query, threshold);
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    @Id
    default URI id() {
        return TOPICS;
    }


    @Override
    Set<Topic> members();

}
