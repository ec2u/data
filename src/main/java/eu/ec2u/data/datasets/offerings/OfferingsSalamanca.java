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
import com.metreeca.mesh.tools.Store;
import com.metreeca.shim.URIs;

import eu.ec2u.data.datasets.courses.Course;
import eu.ec2u.data.datasets.courses.CourseFrame;
import eu.ec2u.data.datasets.programs.ProgramFrame;

import java.net.URI;
import java.time.Duration;
import java.util.Locale;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Optional;
import java.util.Set;
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
import static com.metreeca.shim.Lambdas.lenient;
import static com.metreeca.shim.Loggers.time;
import static com.metreeca.shim.Streams.optional;
import static com.metreeca.shim.URIs.uri;

import static eu.ec2u.data.Data.DATA;
import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.datasets.Localized.EN;
import static eu.ec2u.data.datasets.courses.Courses.COURSES;
import static eu.ec2u.data.datasets.programs.Program.review;
import static eu.ec2u.data.datasets.programs.Programs.PROGRAMS;
import static eu.ec2u.data.datasets.universities.University.SALAMANCA;
import static eu.ec2u.data.datasets.universities.University.uuid;
import static java.lang.String.format;
import static java.util.function.Predicate.not;

public final class OfferingsSalamanca implements Runnable {

    private static final String PROGRAMS_URL="offerings-salamanca-programs-url";
    private static final String COURSES_URL="offerings-salamanca-courses-url";
    private static final String PROGRAMS_COURSES_URL="offerings-salamanca-programs-courses-url";


    private static final Map<String, Duration> DURATIONS=map(
            entry("A", Duration.ofDays(365)),
            entry("S", Duration.ofDays(180)),
            entry("Q", Duration.ofDays(120)),
            entry("T", Duration.ofDays(90))
    );


    public static void main(final String... args) {
        exec(() -> new OfferingsSalamanca().run());
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final Vault vault=service(vault());
    private final Store store=service(store());
    private final Logger logger=service(logger());


    @Override
    public void run() {
        time(() -> {

            final int modified=Stream

                    .of(

                            async(() -> store.modify(

                                    array(Stream.of(vault.get(PROGRAMS_URL))
                                            .flatMap(this::programs)
                                    ),

                                    value(query(new ProgramFrame(true))
                                            .where("university", criterion().any(SALAMANCA))
                                    )

                            )),

                            async(() -> store.modify(

                                    array(Stream.of(vault.get(COURSES_URL))
                                            .flatMap(this::courses)
                                    ),

                                    value(query(new CourseFrame(true))
                                            .where("university", criterion().any(SALAMANCA))
                                    )

                            ))

                    )

                    .collect(joining())
                    .reduce(0, Integer::sum);

            // after programs and courses are uploaded

            final int mutated=store.mutate(

                    array(Stream.of(vault.get(PROGRAMS_COURSES_URL))
                            .flatMap(this::coursePrograms)
                    )

            );

            return modified+mutated;

        }).apply((elapsed, resources) -> logger.info(this, format(
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
        return json.get("programCode").string().flatMap(code -> review(new ProgramFrame()

                .id(programID(code))
                .university(SALAMANCA)

                .url(set(programUrl(json).stream()))
                .identifier(code)

                .name(programName(json).orElse(null))

        ));
    }


    private URI programID(final String code) {
        return PROGRAMS.id().resolve(uuid(SALAMANCA, code));
    }

    private Optional<URI> programUrl(final Value json) {
        return json.get("programUrl").string().map(URIs::uri);
    }

    private Optional<Map<Locale, String>> programName(final Value json) {
        return json.get("programName").string().map(v -> map(entry(SALAMANCA.locale(), v)));
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Stream<CourseFrame> courses(final String url) {
        return Stream.of(url)

                .flatMap(optional(new GET<>(new JSON())))

                .flatMap(Value::values)

                .map(json -> async(() -> course(json).flatMap(Course::review)))

                .collect(joining())
                .flatMap(Optional::stream);
    }

    private Optional<CourseFrame> course(final Value json) {
        return json.get("code").string().map(code -> new CourseFrame()

                .id(courseId(code))
                .university(SALAMANCA)

                .url(set(courseUrl(json).stream()))
                .courseCode(code)

                .name(map(courseName(json)))

                .numberOfCredits(courseNumberOfCredits(json).orElse(null))
                .timeRequired(courseTimeRequired(json).orElse(null))

        );
    }


    private URI courseId(final String code) {
        return COURSES.id().resolve(uuid(SALAMANCA, code));
    }

    private Optional<URI> courseUrl(final Value json) {
        return json.get("url").string().map(URIs::uri);
    }

    private Stream<Entry<Locale, String>> courseName(final Value json) {
        return Stream.concat(

                json.get("nameInEnglish").string()
                        .filter(not(String::isBlank))
                        .map(v -> entry(EN, v))
                        .stream(),

                json.get("nameInSpanish").string()
                        .filter(not(String::isBlank))
                        .map(v -> entry(SALAMANCA.locale(), v))
                        .stream()

        );
    }

    private Optional<Double> courseNumberOfCredits(final Value json) {
        return json.get("ects").string()
                .flatMap(lenient(Double::parseDouble));
    }

    private Optional<Duration> courseTimeRequired(final Value json) {
        return json.get("field_guias_asig_tdu_value").string()
                .map(DURATIONS::get);
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Stream<CourseFrame> coursePrograms(final String url) {

        final Set<URI> courses=set(store

                .retrieve(value(query()
                        .model(new CourseFrame(true).id(uri()))
                        .where("university", criterion().any(SALAMANCA))
                ))

                .stream()
                .flatMap(Value::values)
                .map(CourseFrame::new)
                .map(CourseFrame::id)
                .map(DATA::resolve)
        );

        final Set<URI> programs=set(store

                .retrieve(value(query()
                        .model(new ProgramFrame(true).id(uri()))
                        .where("university", criterion().any(SALAMANCA))
                ))

                .stream()
                .flatMap(Value::values)
                .map(ProgramFrame::new)
                .map(ProgramFrame::id)
                .map(DATA::resolve)
        );

        return Stream.of(url)

                .flatMap(optional(new GET<>(new JSON())))

                .flatMap(Value::values)

                .map(json -> async(() -> json.get("code").string().flatMap(course ->
                        json.get("programCode").string().flatMap(program -> {

                            final URI courseId=courseId(course);
                            final URI programId=programID(program);

                            if ( !courses.contains(courseId) ) {

                                logger.warning(this, format(
                                        "unknown course id course <%s> to program <%s> mapping",
                                        course, program
                                ));

                                return Optional.empty();

                            } else if ( !programs.contains(programId) ) {

                                logger.warning(this, format(
                                        "unknown program id course <%s> to program <%s> mapping", course, program
                                ));

                                return Optional.empty();

                            } else {

                                return Optional.of(new CourseFrame(true)
                                        .id(courseId)
                                        .inProgram(set(new ProgramFrame(true).id(programId)))
                                );

                            }

                        })
                )))

                .collect(joining())
                .flatMap(Optional::stream);
    }

}
