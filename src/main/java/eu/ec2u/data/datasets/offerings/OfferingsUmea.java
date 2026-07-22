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

package eu.ec2u.data.datasets.offerings;

import com.metreeca.flow.http.actions.Fetch;
import com.metreeca.flow.http.actions.Parse;
import com.metreeca.flow.http.actions.Query;
import com.metreeca.flow.json.formats.JSON;
import com.metreeca.mesh.Value;
import com.metreeca.shim.URIs;

import java.net.URI;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Optional;
import java.util.stream.Stream;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.http.Request.POST;
import static com.metreeca.flow.services.Vault.vault;
import static com.metreeca.mesh.Value.*;
import static com.metreeca.mesh.meta.Values.string;
import static com.metreeca.shim.Lambdas.lenient;
import static com.metreeca.shim.Streams.optional;

import static java.util.Map.entry;
import static java.util.stream.Collectors.toMap;

/**
 * Umeå offerings search API.
 *
 * <p>Shared access to the undocumented REST/JSON search API backing the Umeå study
 * catalogue, used by the {@linkplain OfferingsUmeaCourses course} and {@linkplain OfferingsUmeaPrograms program}
 * pipelines.</p>
 */
final class OfferingsUmea {

    /**
     * The vault key of the search API endpoint.
     */
    private static final String OFFERINGS_URL="offerings-umea-url";


    /**
     * Lists the offering pages advertised by the search API.
     *
     * @param label the {@code contentlabel} filter value selecting the kind of offering to be listed, for instance
     *              {@code kurs} or {@code program}
     *
     * @return the publication timestamps of the listed pages, keyed by page URL; pages advertising no parsable
     *         publication timestamp are reported as published at {@link Instant#EPOCH}
     *
     * @throws NullPointerException if {@code label} is {@code null}
     */
    static Map<URI, Instant> stamps(final String label) {

        if ( label == null ) {
            throw new NullPointerException("null label");
        }

        return Stream.of(service(vault()).get(OFFERINGS_URL))

                .flatMap(optional(new Query(request -> request

                        .method(POST)

                        .header("Content-Type", "application/json")
                        .header("Accept", "application/json")

                        .body(new JSON(), object(
                                field("Query", string("")),
                                field("Skip", string("0")),
                                field("Take", string("10000")),
                                field("QueryPrefix", string("hepp")),
                                field("Filters", array(
                                        object(
                                                field("Type", integer(2)),
                                                field("Value", string("1305560umucms,1305559umucms"))
                                        ),
                                        object(
                                                field("Type", integer(5)),
                                                field("Name", string("contentlabel")),
                                                field("Value", string(label))
                                        )
                                ))
                        ))

                )))

                .flatMap(optional(new Fetch()))
                .flatMap(optional(new Parse<>(new JSON())))

                .flatMap(results -> results.select("hits.*").values())
                .flatMap(hit -> stamp(hit).stream())

                .collect(toMap(Entry::getKey, Entry::getValue, OfferingsUmea::latest));
    }


    private static Optional<Entry<URI, Instant>> stamp(final Value hit) {
        return hit.get("url").string()

                .flatMap(lenient(URIs::uri))

                .map(url -> entry(url, hit.get("publishDate").string()
                        .flatMap(lenient(OffsetDateTime::parse))
                        .map(OffsetDateTime::toInstant)
                        .orElse(Instant.EPOCH)
                ));
    }

    private static Instant latest(final Instant x, final Instant y) {
        return x.isAfter(y) ? x : y;
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private OfferingsUmea() { }

}
