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

import com.metreeca.flow.services.Logger;
import com.metreeca.mesh.Value;
import com.metreeca.mesh.tools.Store;

import java.net.URI;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.json.formats.JSON.store;
import static com.metreeca.mesh.Value.string;
import static com.metreeca.mesh.queries.Criterion.criterion;
import static com.metreeca.mesh.queries.Query.query;
import static com.metreeca.mesh.util.Collections.stash;
import static com.metreeca.mesh.util.URIs.uri;

import static eu.ec2u.data.taxonomies.Topics.TOPICS;
import static java.lang.String.format;
import static java.util.Locale.ROOT;
import static java.util.function.Predicate.not;

final class TopicsSupport {

    private static final Map<String, Topic> CACHE=new ConcurrentHashMap<>();


    static Optional<Topic> topic(final URI taxonomy, final String label) {

        final Store store=service(store());
        final Logger logger=service(Logger.logger());

        return Optional.of(label).map(t -> CACHE.computeIfAbsent(t.toLowerCase(ROOT), key -> store

                .retrieve(new TopicsFrame(true)

                        .id(TOPICS)

                        .members(stash(query()

                                .model(new TopicFrame(true).id(uri()))

                                .where("inScheme", criterion().any(new TaxonomyFrame(true).id(taxonomy).get()))
                                .where("indexed", criterion().any(string(key)))

                        ))

                )

                .value()
                .filter(not(Value::isEmpty))

                .flatMap(value -> value.get("members").values()
                        .findFirst()
                        .flatMap(Value::id)
                        .map(id -> new TopicFrame(true).id(id))
                )

                .orElseGet(() -> {

                    logger.warning(Topic.class, format(
                            "unknown <%s> topic <%s>", taxonomy, label
                    ));

                    return new TopicFrame(true);

                })

        ));
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private TopicsSupport() { }

}
