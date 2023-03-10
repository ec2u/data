/*
 * Copyright © 2020-2023 EC2U Alliance
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

package eu.ec2u.data.offers;

import com.metreeca.core.Xtream;
import com.metreeca.core.actions.Fill;
import com.metreeca.core.services.Vault;
import com.metreeca.http.actions.GET;
import com.metreeca.json.JSONPath;
import com.metreeca.json.codecs.JSON;
import com.metreeca.link.Frame;
import com.metreeca.link.Values;
import com.metreeca.rdf4j.actions.Upload;

import eu.ec2u.data.resources.Resources;
import eu.ec2u.data.things.Schema;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.vocabulary.RDF;

import java.time.Instant;
import java.time.Period;
import java.util.*;
import java.util.stream.Stream;

import static com.metreeca.core.Locator.service;
import static com.metreeca.core.services.Vault.vault;
import static com.metreeca.link.Frame.frame;
import static com.metreeca.link.Values.iri;
import static com.metreeca.link.Values.literal;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.EC2U.University.Salamanca;
import static eu.ec2u.data.EC2U.item;
import static eu.ec2u.data.offers.Offers.*;
import static eu.ec2u.work.validation.Validators.validate;

import static java.lang.String.format;
import static java.util.Map.entry;
import static java.util.stream.Collectors.toSet;

public final class OffersSalamanca implements Runnable {

    private static final IRI Context=iri(Offers.Context, "/salamanca");

    private static final String ProgramsURL="offers-salamanca-programs-url";
    private static final String CoursesURL="offers-salamanca-courses-url";
    private static final String ProgramsCoursesURL="courses-salamanca-programs-courses-url";


    private static final Map<String, Period> Durations=Map.ofEntries(
            entry("A", Period.ofYears(1)),
            entry("S", Period.ofMonths(6)),
            entry("Q", Period.ofMonths(4)),
            entry("T", Period.ofMonths(3))
    );


    public static void main(final String... args) {
        exec(() -> new OffersSalamanca().run());
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final Vault vault=service(vault());


    @Override public void run() {
        Xtream

                .from(

                        Xtream.of(Instant.EPOCH)

                                .flatMap(this::programs)
                                .optMap(this::program)

                                .batch(1000).flatMap(programs -> // !!! optimize validation
                                        validate(Program(), Set.of(Program), programs.stream())
                                ),

                        Xtream.of(Instant.EPOCH)

                                .flatMap(this::courses)
                                .optMap(this::course)

                                .batch(1000).flatMap(courses -> // !!! optimize validation
                                        validate(Course(), Set.of(Course), courses.stream())
                                ),


                        Xtream.of(Instant.EPOCH)

                                .flatMap(this::programsCourses)
                                .optMap(this::programCourses)

                                .pipe(frames -> Xtream.of(frames
                                        .flatMap(Frame::stream)
                                        .collect(toSet())
                                ))

                )

                .forEach(new Upload()
                        .contexts(Context)
                        .clear(true)
                );
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Xtream<JSONPath> programs(final Instant synced) {

        final String url=vault
                .get(ProgramsURL)
                .orElseThrow(() -> new IllegalStateException(format(
                        "undefined API URL <%s>", ProgramsURL
                )));

        return Xtream.of(synced)

                .flatMap(new Fill<>()
                        .model(url)
                )

                .optMap(new GET<>(new JSON()))

                .map(JSONPath::new)
                .flatMap(json -> json.paths("*"));
    }

    private Optional<Frame> program(final JSONPath json) {
        return json.string("programCode")

                .filter(code -> !code.equals("293")) // !!!

                .map(code -> frame(item(Programs, Salamanca, code))

                        .values(RDF.TYPE, Program)
                        .value(Resources.university, Salamanca.Id)

                        .value(Schema.url, json.string("programUrl").map(Values::iri))
                        .value(Schema.identifier, literal(code))

                        .values(Schema.name, json.strings("programName").map(v -> literal(v, Salamanca.Language)))

                );
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Xtream<JSONPath> courses(final Instant synced) {

        final String url=vault
                .get(CoursesURL)
                .orElseThrow(() -> new IllegalStateException(format(
                        "undefined API URL <%s>", CoursesURL
                )));

        return Xtream.of(synced)

                .flatMap(new Fill<>()
                        .model(url)
                )

                .optMap(new GET<>(new JSON()))

                .map(JSONPath::new)
                .flatMap(json -> json.paths("*"));
    }

    private Optional<Frame> course(final JSONPath json) {
        return json.string("code").map(code -> frame(item(Courses, Salamanca, code))

                .values(RDF.TYPE, Course)
                .value(Resources.university, Salamanca.Id)

                .value(Schema.url, json.string("urlEN").map(Values::iri))
                .value(Schema.identifier, literal(code))

                .values(Schema.name, Stream.concat(
                        json.strings("nameInEnglish").map(v -> literal(v, "en")),
                        json.strings("nameInSpanish").map(v -> literal(v, Salamanca.Language))
                ))

                .values(Schema.courseCode, literal(code))

                .value(Schema.numberOfCredits, json.string("ects")
                        .map(Offers::ects)
                        .map(Values::literal)
                )

                .value(Schema.timeRequired, json.string("field_guias_asig_tdu_value")
                        .map(Durations::get)
                        .map(Values::literal)
                )

        );
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Xtream<JSONPath> programsCourses(final Instant synced) {

        final String url=vault
                .get(ProgramsCoursesURL)
                .orElseThrow(() -> new IllegalStateException(format(
                        "undefined API URL <%s>", ProgramsCoursesURL
                )));

        return Xtream.of(synced)

                .flatMap(new Fill<>()
                        .model(url)
                )

                .optMap(new GET<>(new JSON()))

                .map(JSONPath::new)
                .flatMap(json -> json.paths("*"));
    }

    private Optional<Frame> programCourses(final JSONPath json) {
        return json.string("programCode").map(program -> frame(item(Programs, Salamanca, program))
                .value(Schema.hasCourse, json.string("code").map(course -> item(Courses, Salamanca, course)))
        );
    }

}
