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


import com.metreeca.flow.http.actions.GET;
import com.metreeca.flow.json.formats.JSON;
import com.metreeca.flow.services.Logger;
import com.metreeca.flow.services.Vault;
import com.metreeca.mesh.Value;
import com.metreeca.mesh.pipe.Store;
import com.metreeca.shim.Locales;
import com.metreeca.shim.URIs;

import eu.ec2u.data.datasets.courses.Course;
import eu.ec2u.data.datasets.courses.CourseFrame;
import eu.ec2u.data.datasets.programs.ProgramFrame;
import eu.ec2u.data.datasets.taxonomies.TopicFrame;

import java.net.URI;
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
import static com.metreeca.shim.Streams.optional;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.datasets.courses.Courses.COURSES;
import static eu.ec2u.data.datasets.programs.Program.review;
import static eu.ec2u.data.datasets.programs.Programs.PROGRAMS;
import static eu.ec2u.data.datasets.taxonomies.TopicsEC2UStakeholders.LLL;
import static eu.ec2u.data.datasets.universities.University.LINZ;
import static eu.ec2u.data.datasets.universities.University.uuid;
import static java.lang.String.format;
import static java.util.function.Predicate.not;

public final class OfferingsLinz implements Runnable {

    private static final String PROGRAMS_URL="programs-linz-url";
    private static final String COURSES_URL="courses-linz-url";


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    public static void main(final String... args) {
        exec(() -> new OfferingsLinz().run());
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

                                array(Stream.of(vault.get(PROGRAMS_URL))
                                        .flatMap(this::programs)
                                ),

                                value(query(new ProgramFrame(true))
                                        .where("university", criterion().any(LINZ))
                                )

                        )),

                        async(() -> store.modify(

                                array(Stream.of(vault.get(COURSES_URL))
                                        .flatMap(this::courses)
                                ),

                                value(query(new CourseFrame(true))
                                        .where("university", criterion().any(LINZ))
                                )

                        ))

                )

                .collect(joining())
                .reduce(0, Integer::sum)

        ).apply((elapsed, resources) -> logger.info(this, format(
                "synced <%,d> resources in <%,d> ms", resources, elapsed
        )));
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Stream<ProgramFrame> programs(final String url) {
        return Stream.of(url)

                .flatMap(optional(new GET<>(new JSON())))

                .flatMap(Value::values)

                .map(json -> async(() -> program(json)))

                .collect(joining())
                .flatMap(Optional::stream);
    }

    private Optional<ProgramFrame> program(final Value json) {
        return json.get("identifier").strings().findFirst().flatMap(code -> review(new ProgramFrame()

                .id(PROGRAMS.id().resolve(uuid(LINZ, code)))
                .university(LINZ)

                .url(set(url(json)))
                .identifier(code)

                .name(map(text(json.get("name"))))
                .description(map(text(json.get("description"))))

                .numberOfCredits(numberOfCredits(json).orElse(null))
                .educationalLevel(educationalLevel(json).orElse(null))

        ));
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Stream<CourseFrame> courses(final String url) {
        return Stream.of(url)

                .flatMap(optional(new GET<>(new JSON())))

                .flatMap(Value::values)

                .map(json -> async(() -> course(json)
                        .flatMap(Course::review)
                ))

                .collect(joining())
                .flatMap(Optional::stream);
    }

    private Optional<CourseFrame> course(final Value json) {
        return json.get("courseCode").string().map(code -> new CourseFrame()

                .id(COURSES.id().resolve(uuid(LINZ, code)))
                .university(LINZ)

                .url(set(url(json)))
                .courseCode(code)

                .name(map(text(json.get("name"))))
                .description(map(text(json.get("description"))))

                .numberOfCredits(numberOfCredits(json).orElse(null))
                .educationalLevel(educationalLevel(json).orElse(null))

                .inProgram(set(json.select("inProgram.*.identifier").strings().map(v ->
                        new ProgramFrame(true).id(PROGRAMS.id().resolve(uuid(LINZ, v)))
                )))

                .audience(set(json.select("audience").strings()
                        .filter(v -> v.equalsIgnoreCase("Lifelong Learning"))
                        .map(v -> LLL)
                ))

        );
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Stream<URI> url(final Value json) {
        return json.get("url").strings().map(URIs::uri);
    }

    private Stream<Entry<Locale, String>> text(final Value json) {
        return json.object().stream()
                .flatMap(fields -> fields.entrySet().stream())
                .map(e -> entry(Locales.locale(e.getKey()), e.getValue().string().orElse("")))
                .filter(not(e -> e.getValue().isBlank()));
    }

    private Optional<Double> numberOfCredits(final Value json) {
        return json.get("numberOfCredits").floating();
    }

    private Optional<TopicFrame> educationalLevel(final Value json) {
        return json.get("educationalLevel").string()
                .map(v -> v.replace("/concepts/", "/taxonomies/")) // !!!
                .map(URIs::uri)
                .map(id -> new TopicFrame(true).id(id));
    }

}
