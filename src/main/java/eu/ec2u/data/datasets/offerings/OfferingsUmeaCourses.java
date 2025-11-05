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
import com.metreeca.flow.services.Logger;
import com.metreeca.flow.services.Vault;
import com.metreeca.shim.URIs;

import eu.ec2u.data.datasets.courses.CourseFrame;
import eu.ec2u.data.datasets.courses.Courses;
import eu.ec2u.work.PageKeeper;

import java.net.URI;
import java.util.Optional;
import java.util.stream.Stream;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.http.Request.POST;
import static com.metreeca.flow.services.Logger.logger;
import static com.metreeca.flow.services.Vault.vault;
import static com.metreeca.mesh.Value.*;
import static com.metreeca.mesh.meta.Values.string;
import static com.metreeca.shim.Lambdas.lenient;
import static com.metreeca.shim.Loggers.time;
import static com.metreeca.shim.Streams.optional;
import static com.metreeca.shim.URIs.uri;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.datasets.universities.University.UMEA;
import static java.lang.String.format;
import static java.util.stream.Collectors.collectingAndThen;
import static java.util.stream.Collectors.toSet;

public final class OfferingsUmeaCourses implements Runnable {

    private static final String OFFERINGS_URL="offerings-umea-url";

    private static final URI PIPELINE=uri("java:%s".formatted(OfferingsUmeaCourses.class.getName()));


    public static void main(final String... args) {
        exec(() -> new OfferingsUmeaCourses().run());
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final Vault vault=service(vault());
    private final Logger logger=service(logger());


    @Override
    public void run() {
        time(() -> Stream.of(vault.get(OFFERINGS_URL))

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
                                                field("Value", string("kurs"))
                                        )
                                ))
                        ))

                )))

                .flatMap(optional(new Fetch()))
                .flatMap(optional(new Parse<>(new JSON())))

                .flatMap(v -> v.select("hits.*.url").strings())
                .flatMap(optional(lenient(URIs::uri)))

                .collect(collectingAndThen(toSet(), new PageKeeper<CourseFrame>(PIPELINE)
                        .insert(page -> new Courses.Scanner().apply(page, new CourseFrame().university(UMEA)))
                        .remove(page -> Optional.of(new CourseFrame(true).id(page.resource())))
                ))

        ).apply((elapsed, resources) -> logger.info(this, format(
                "synced <%,d> resources in <%,d> ms", resources, elapsed
        )));
    }

}
