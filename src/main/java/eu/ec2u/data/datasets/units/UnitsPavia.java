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

package eu.ec2u.data.datasets.units;

import com.metreeca.flow.http.actions.GET;
import com.metreeca.flow.json.formats.JSON;
import com.metreeca.flow.services.Logger;
import com.metreeca.flow.services.Vault;
import com.metreeca.mesh.Valuable;
import com.metreeca.mesh.Value;
import com.metreeca.shim.Futures;

import eu.ec2u.data.datasets.Reference;
import eu.ec2u.data.datasets.organizations.OrganizationFrame;
import eu.ec2u.data.datasets.taxonomies.TopicFrame;

import java.util.Collection;
import java.util.stream.Stream;

import static com.metreeca.flow.Locator.async;
import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.json.formats.JSON.store;
import static com.metreeca.flow.services.Logger.logger;
import static com.metreeca.flow.services.Vault.vault;
import static com.metreeca.mesh.Value.array;
import static com.metreeca.mesh.Value.value;
import static com.metreeca.mesh.queries.Criterion.criterion;
import static com.metreeca.mesh.queries.Query.query;
import static com.metreeca.shim.Collections.*;
import static com.metreeca.shim.Streams.concat;
import static com.metreeca.shim.Streams.optional;
import static com.metreeca.shim.URIs.uri;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.datasets.Localized.EN;
import static eu.ec2u.data.datasets.units.Unit._review;
import static eu.ec2u.data.datasets.universities.University.PAVIA;
import static java.util.Locale.ROOT;
import static java.util.Map.entry;

public final class UnitsPavia implements Runnable {

    private static final String API_URL="units-coimbra-url";
    private static final String API_KEY="units-coimbra-key";


    public static void main(final String... args) {
        exec(() -> new UnitsPavia().run());
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final Vault vault=service(vault());
    private final Logger logger=service(logger());


    @Override
    public void run() {
        service(store()).modify(

                array(list(units()
                        .map(json -> async(() -> list(unit(json))))
                        .collect(Futures.joining())
                        .flatMap(Collection::stream)
                )),

                value(query(new UnitFrame(true)).where("university", criterion().any(PAVIA)))

        );
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Stream<Value> units() {

        final String url="http://localhost:2025/units/"; // !!! final String url=vault.get(API_URL);

        return Stream.of("%s?%s".formatted(url, PAVIA.id()))
                .flatMap(optional(new GET<>(new JSON())))
                .flatMap(Value::values);
    }

    private Stream<? extends Valuable> unit(final Value json) {
        return json.get("id").string().stream().flatMap(optional(id -> _review(new UnitFrame()

                .generated(true)

                .id(uri(id))

                .label(json.get("formal").string()
                        .map(v -> map(entry(EN, v)))
                        .orElse(null)
                )

                .comment(json.get("summary").string()
                        .map(v -> map(entry(EN, v)))
                        .orElse(null)
                )

                .university(PAVIA) // !!! factor

                .identifier(json.get("identifier").string()
                        .orElse(null)
                )

                .mbox(set(json.get("email").string()
                        .flatMap(Reference::email)
                ))

                .homepage(set(concat(
                        json.get("profile").uri(),
                        json.get("website").uri()
                )))

                .prefLabel(json.get("formal").string()
                        .map(v -> map(entry(EN, v)))
                        .orElse(null)
                )

                .altLabel(map(concat(
                        json.get("acronym").string()
                                .map(v -> entry(ROOT, v))
                                .stream(),
                        json.get("formal").string()
                                .map(v -> entry(EN, v))
                                .stream()
                )))

                .definition(json.get("description").string()
                        .map(v -> map(entry(EN, v)))
                        .orElse(null)
                )

                .unitOf(set(json.get("parent").uri()
                        .map(v -> new OrganizationFrame().id(v))
                ))

                .classification(set(json.get("type").uri()
                        .map(v -> new TopicFrame().id(v))
                ))

                .subject(set(json.get("topics").uris()
                        .map(v -> new TopicFrame().id(v))
                ))

                .keyword(set(json.get("keywords").strings()))

        )));
    }

}
