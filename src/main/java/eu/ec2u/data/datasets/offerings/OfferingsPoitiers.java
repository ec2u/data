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


import com.metreeca.flow.json.formats.JSON;
import com.metreeca.flow.services.Logger;
import com.metreeca.flow.services.Vault;
import com.metreeca.mesh.Value;
import com.metreeca.mesh.pipe.Store;

import eu.ec2u.data.datasets.courses.CourseFrame;
import eu.ec2u.data.datasets.organizations.OrganizationFrame;
import eu.ec2u.data.datasets.programs.ProgramFrame;
import eu.ec2u.data.datasets.taxonomies.Topic;
import eu.ec2u.data.datasets.taxonomies.TopicsISCED2011;

import java.io.IOException;
import java.io.Reader;
import java.io.UncheckedIOException;
import java.util.Locale;
import java.util.Map.Entry;
import java.util.Optional;
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
import static com.metreeca.shim.Futures.joining;
import static com.metreeca.shim.Loggers.time;
import static com.metreeca.shim.Resources.reader;
import static com.metreeca.shim.Resources.resource;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.datasets.courses.Courses.COURSES;
import static eu.ec2u.data.datasets.organizations.Organizations.ORGANIZATIONS;
import static eu.ec2u.data.datasets.programs.Program.review;
import static eu.ec2u.data.datasets.programs.Programs.PROGRAMS;
import static eu.ec2u.data.datasets.universities.University.POITIERS;
import static eu.ec2u.data.datasets.universities.University.uuid;
import static java.lang.String.format;

public final class OfferingsPoitiers implements Runnable {

    private static final String API_URL="offers-poitiers-url";
    private static final String API_ID="offers-poitiers-id";
    private static final String API_TOKEN="offers-poitiers-token";


    public static void main(final String... args) {
        exec(() -> new OfferingsPoitiers().run());
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final Vault vault=service(vault());
    private final Store store=service(store());
    private final Logger logger=service(logger());


    @Override
    public void run() {
        time(() -> Stream

                .of(

                        async(() -> store.modify(

                                array(programs()),

                                value(query(new ProgramFrame(true))
                                        .where("university", criterion().any(POITIERS))
                                )

                        ))

                        // async(() -> store.modify(
                        //
                        //         array(Stream.of(vault.get(COURSES_URL))
                        //                 .flatMap(this::courses)
                        //         ),
                        //
                        //         value(query(new CourseFrame(true))
                        //                 .where("university", criterion().any(POITIERS))
                        //         )
                        //
                        // ))

                )

                .collect(joining())
                .reduce(0, Integer::sum)

        ).apply((elapsed, resources) -> logger.info(this, format(
                "synced <%,d> resources in <%,d> ms", resources, elapsed
        )));
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Stream<ProgramFrame> programs() {

        // !!! vault.get(PROGRAMS_URL)

        try ( final Reader reader=reader(resource(this, ".json")) ) {

            // !!! return  Stream.of(url)
            //
            //         .flatMap(optional(new GET<>(new JSON())))

            return Stream.of(JSON.json(reader))

                    .map(Value::get)
                    .flatMap(Value::values)

                    .map(json -> async(() -> program(json)))

                    .collect(joining())
                    .flatMap(Optional::stream);

        } catch ( final IOException e ) {

            throw new UncheckedIOException(e);

        }

    }

    private Optional<ProgramFrame> program(final Value json) {
        return json.get("code").string().flatMap(code -> review(new ProgramFrame()

                        .id(PROGRAMS.id().resolve(uuid(POITIERS, code)))
                        .university(POITIERS)

                        .identifier(code)

                        .name(map(name(json, code)))

                        .educationalLevel(educationalLevel(json).orElse(null))
                        .numberOfCredits(numberOfCredits(json).orElse(null))

                        .provider(provider(json).orElse(null))

                        .about(set(about(json)))
                // .hasCourse(set(hasCourse(json))) // !!! enable after courses are ingested

        ));
    }


    private Stream<Entry<Locale, String>> name(final Value json, final String code) {
        return json.get("name").string()
                .map(name -> entry(POITIERS.locale(), format("%s - %s", code, name)))
                .stream();
    }

    private Optional<Topic> educationalLevel(final Value json) {
        return json.get("levelISCED").integral()
                .map(Number::intValue)
                .map(TopicsISCED2011.LEVELS::get);
    }

    private Optional<Double> numberOfCredits(final Value json) {
        return json.get("credits").floating();
    }

    private Optional<OrganizationFrame> provider(final Value json) {
        return json.get("composante").string()
                .map(name -> new OrganizationFrame()
                        .id(ORGANIZATIONS.id().resolve(uuid(POITIERS, name)))
                        .university(POITIERS)
                        .prefLabel(map(entry(POITIERS.locale(), name)))
                );
    }

    private Stream<Topic> about(final Value json) {
        return json.get("discipline").string().stream()
                .flatMap(Offering.iscedf())
                .limit(1);
    }

    private Stream<CourseFrame> hasCourse(final Value json) {
        return json.select("options.*.elemPedago").objects()
                .flatMap(courses -> courses.entrySet().stream())
                .map(e -> new CourseFrame(true)
                        .id(COURSES.id().resolve(uuid(POITIERS, e.getKey())))
                );
    }

}
