/*
 * Copyright © 2020-2026 EC2U Alliance
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

import com.metreeca.flow.csv.actions.Transform;
import com.metreeca.flow.services.Logger;
import com.metreeca.flow.services.Vault;
import com.metreeca.mesh.Value;
import com.metreeca.mesh.pipe.Store;
import com.metreeca.shim.Locales;
import com.metreeca.shim.URIs;

import eu.ec2u.data.datasets.courses.Course;
import eu.ec2u.data.datasets.courses.CourseFrame;
import eu.ec2u.data.datasets.organizations.OrganizationFrame;
import eu.ec2u.data.datasets.persons.Person;
import eu.ec2u.data.datasets.persons.PersonFrame;
import eu.ec2u.data.datasets.programs.Program;
import eu.ec2u.data.datasets.programs.ProgramFrame;
import eu.ec2u.data.datasets.taxonomies.TopicFrame;
import eu.ec2u.data.datasets.taxonomies.TopicsISCED2011;
import eu.ec2u.data.datasets.taxonomies.TopicsISCEDF2013;
import eu.ec2u.data.datasets.taxonomies.TopicsSDGs;
import eu.ec2u.data.datasets.universities.University;
import eu.ec2u.data.vocabularies.schema.SchemaEvent.EventAttendanceModeEnumeration;
import org.apache.commons.csv.CSVRecord;

import java.net.URI;
import java.time.Duration;
import java.util.Collection;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Optional;
import java.util.regex.Pattern;
import java.util.stream.Stream;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.json.formats.JSON.store;
import static com.metreeca.flow.services.Logger.logger;
import static com.metreeca.flow.services.Vault.vault;
import static com.metreeca.mesh.Value.array;
import static com.metreeca.mesh.Value.uri;
import static com.metreeca.mesh.queries.Criterion.criterion;
import static com.metreeca.mesh.queries.Query.query;
import static com.metreeca.shim.Collections.*;
import static com.metreeca.shim.Lambdas.lenient;
import static com.metreeca.shim.Loggers.time;
import static com.metreeca.shim.Strings.split;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.datasets.Localized.EN;
import static eu.ec2u.data.datasets.courses.Course.review;
import static eu.ec2u.data.datasets.courses.Courses.COURSES;
import static eu.ec2u.data.datasets.organizations.Organizations.ORGANIZATIONS;
import static eu.ec2u.data.datasets.programs.Programs.PROGRAMS;
import static eu.ec2u.data.datasets.taxonomies.TopicsEC2UStakeholders.EC2U_STAKEHOLDERS;
import static eu.ec2u.data.datasets.universities.Universities.UNIVERSITIES;
import static eu.ec2u.data.datasets.universities.University.PARTNERS;
import static eu.ec2u.data.datasets.universities.University.uuid;
import static eu.ec2u.data.vocabularies.schema.SchemaEvent.EventAttendanceModeEnumeration.*;
import static java.lang.Math.floor;
import static java.lang.Math.round;
import static java.lang.String.format;
import static java.util.Locale.ROOT;
import static java.util.function.Predicate.not;

public final class OfferingsLLL extends Transform<CourseFrame> implements Runnable {

    private static final String DATA_URL="offerings-lll-url-next"; // vault label
    private static final URI PIPELINE=URIs.uri("java:%s".formatted(OfferingsLLL.class.getName()));

    private static final TopicFrame LLL=new TopicFrame(true).id(
            EC2U_STAKEHOLDERS.id().resolve("teaching/students/continuing-education")
    );


    private static final Pattern CODE_PATTERN=Pattern.compile("\\S+");
    private static final Pattern ISCEDF_PATTERN=Pattern.compile("\\d{3,}");
    private static final Pattern SCALE_PATTERN=Pattern.compile("0-\\d+|[^/]+(?:/[^/]+)+");


    enum Test {

        WrittenTest,
        QuizTest,
        OralTest,
        CourseworkTest

    }

    enum Grade {

        VoteGrade,
        JudgementGrade

    }


    public static void main(final String... args) {
        exec(() -> new OfferingsLLL().run());
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final Vault vault=service(vault());
    private final Store store=service(store());
    private final Logger logger=service(logger());


    @Override
    public void run() {

        final String url=vault.get(DATA_URL);

        time(() -> {

            final List<CourseFrame> courses=list(Stream.of(url).flatMap(this));

            return store.modify(

                    array(courses.stream()
                            .flatMap(course -> course.inProgram().stream())
                            .map(ProgramFrame::new)
                            .distinct()
                    ),

                    Value.value(query(new ProgramFrame(true))
                            .where("pipeline", criterion().any(uri(PIPELINE)))
                    )

            )+store.modify(

                    array(courses.stream()),

                    Value.value(query(new CourseFrame(true))
                            .where("pipeline", criterion().any(uri(PIPELINE)))
                    )

            );

        }).apply((elapsed, resources) -> logger.info(this, format(
                "synced <%,d> resources in <%,d> ms", resources, elapsed
        )));

    }

    @Override
    protected Stream<CourseFrame> process(final CSVRecord record, final Collection<CSVRecord> records) {
        return university(record).flatMap(university -> id(record, university)
                .filter(not(id -> disabled(record)))
                .flatMap(id -> review(new CourseFrame()

                                .id(id)
                                .pipeline(PIPELINE)
                                .audience(set(LLL))

                                .university(university)
                                .year(year(record).orElse(null))
                                .term(set(term(record)))

                                .name(map(title(record, university)))
                                .inProgram(set(program(record, university)))
                                .provider(provider(record, university).orElse(null))
                                // !!! .instructor(instructor(record, university).orElse(null))

                                .courseCode(code(record).orElse(null))
                                .courseMode(mode(record).orElse(null))
                                .inLanguage(set(language(record)))
                                .isAccessibleForFree(fee(record).orElse(null))
                                .numberOfCredits(credits(record).orElse(null))
                                .timeRequired(duration(record).orElse(null))
                                .courseWorkload(workload(record).orElse(null))
                                .educationalLevel(isced2011(record).orElse(null))
                                .about(set(Stream.concat(iscedf2013(record), sdg(record))))

                                // !!! Badge
                                .url(set(url(record).stream()))

                                .teaches(syllabus(record).orElse(null))
                                .coursePrerequisites(prerequisites(record).orElse(null))

                        // !!! Test
                        // !!! Grade
                        // !!! Scale

                ))
        ).stream();
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Optional<URI> id(final CSVRecord record, final University university) {

        final Optional<String> identifier=value(record, "Code");
        final Optional<String> titleEnglish=value(record, "Title (English)");
        final Optional<String> titleLocal=value(record, "Title (Local)");

        if ( titleEnglish.isEmpty() && titleLocal.isEmpty() ) {

            warning(record, "no english/local title provided");

            return Optional.empty();

        } else {

            return Optional.of(COURSES.id().resolve(uuid(university, "LLL/"+identifier
                    .or(() -> titleEnglish)
                    .or(() -> titleLocal)
                    .orElse("")  // unexpected
            )));

        }
    }


    private boolean disabled(final CSVRecord record) {
        return value(record, "-")
                .filter(not(String::isBlank))
                .isPresent();
    }

    private Optional<University> university(final CSVRecord record) {

        final Optional<URI> university=value(record, "University")
                .map(u -> u.toLowerCase(ROOT))
                .map(u -> UNIVERSITIES.id().resolve(u));

        if ( university.isEmpty() ) {
            warning(record, "no university name provided");
        }

        return university.flatMap(id -> PARTNERS.stream()
                .filter(u -> u.id().equals(id))
                .findFirst()
        );
    }

    private Optional<String> year(final CSVRecord record) {
        return value(record, "Year")
                .flatMap(Course::year);
    }

    private Stream<Course.Term> term(final CSVRecord record) {
        return value(record, "Term").stream()
                .flatMap(v -> split(v, ","))
                .map(value -> switch ( value ) {

                    case "annual" -> Course.Term.AnnualTerm;
                    case "first" -> Course.Term.FirstTerm;
                    case "second" -> Course.Term.SecondTerm;
                    case "summer" -> Course.Term.SummerTerm;
                    case "open" -> Course.Term.OpenTerm;


                    default -> null;

                })
                .flatMap(Stream::ofNullable);
    }

    private Stream<Entry<Locale, String>> title(final CSVRecord record, final University university) {
        return Stream.concat(
                value(record, "Title (English)").map(v -> entry(EN, v)).stream(),
                value(record, "Title (Local)").map(v -> entry(university.locale(), v)).stream()
        );
    }

    private Stream<ProgramFrame> program(final CSVRecord record, final University university) {

        final Optional<String> english=value(record, "Program (English)");
        final Optional<String> local=value(record, "Program (Local)");

        return english.or(() -> local)
                .map(key -> new ProgramFrame()
                        .id(PROGRAMS.id().resolve(uuid(university, key)))
                        .pipeline(PIPELINE)
                        .university(university)
                        .name(map(Stream.concat(
                                english.map(v -> entry(EN, v)).stream(),
                                local.map(v -> entry(university.locale(), v)).stream()
                        )))
                )
                .flatMap(Program::review)
                .stream();
    }

    private Optional<OrganizationFrame> provider(final CSVRecord record, final University university) {

        final Optional<String> english=value(record, "Provider (English)");
        final Optional<String> local=value(record, "Provider (Local)");

        return english.or(() -> local)
                .map(key -> new OrganizationFrame()
                        .id(ORGANIZATIONS.id().resolve(uuid(university, key)))
                        .university(university)
                        .prefLabel(map(Stream.concat(
                                english.map(v -> entry(EN, v)).stream(),
                                local.map(v -> entry(university.locale(), v)).stream()
                        )))
                );
    }

    private Stream<PersonFrame> instructor(final CSVRecord record, final University university) {
        return value(record, "Instructor").stream()
                .flatMap(v -> split(v, ";"))
                .map(name -> Person.person(university, name))
                .flatMap(Optional::stream);
    }

    private Optional<String> code(final CSVRecord record) {
        return value(record, "Code")
                .filter(CODE_PATTERN.asMatchPredicate());
    }

    private Optional<EventAttendanceModeEnumeration> mode(final CSVRecord record) {
        return value(record, "Mode").map(value -> switch ( value ) {

            case "presence" -> OfflineEventAttendanceMode;
            case "online" -> OnlineEventAttendanceMode;
            case "hybrid" -> MixedEventAttendanceMode;

            default -> null;

        });
    }

    private Stream<String> language(final CSVRecord record) {
        return value(record, "Language").stream()
                .flatMap(v -> split(v, ","))
                .map(Locales::fuzzy)
                .flatMap(Optional::stream)
                .map(Locale::getLanguage);
    }

    private Optional<Boolean> fee(final CSVRecord record) {
        return value(record, "Fee").map(value -> switch ( value ) {

            case "no" -> true;
            case "yes" -> false;

            default -> null;

        });
    }

    private Optional<Double> credits(final CSVRecord record) {
        return value(record, "Credits", lenient(Double::valueOf))
                .filter(credits -> credits > 0);
    }

    private Optional<Duration> duration(final CSVRecord record) {
        return value(record, "Duration", lenient(Double::valueOf))
                .filter(hours -> hours > 0)
                .map(this::hours);
    }

    private Optional<Duration> workload(final CSVRecord record) {
        return value(record, "Workload", lenient(Double::valueOf))
                .filter(hours -> hours > 0)
                .map(this::hours);
    }

    private Optional<TopicFrame> isced2011(final CSVRecord record) {
        return value(record, "ISCED-2011", lenient(Integer::valueOf))
                .filter(code -> code >= 4 && code <= 9)
                .map(TopicsISCED2011::level);
    }

    private Stream<TopicFrame> iscedf2013(final CSVRecord record) {
        return Stream.concat(
                        value(record, "ISCED-F 2013 (3)").stream(), // !!! remove
                        value(record, "ISCED-F 2013").stream()
                )
                .flatMap(s -> split(s, ","))
                .filter(ISCEDF_PATTERN.asMatchPredicate()) // !!! review
                .flatMap(code -> Stream.of(code, code.substring(0, 3))) // !!! which level? top? 2nd? all broader?
                .distinct()
                .map(TopicsISCEDF2013::code)
                .map(id -> new TopicFrame(true).id(id));
    }

    private Stream<TopicFrame> sdg(final CSVRecord record) {
        return value(record, "SDG").stream()
                .flatMap(v -> split(v, ","))
                .map(lenient(Integer::valueOf))
                .flatMap(Optional::stream)
                .filter(n -> n >= 1 && n <= 17)
                .map(n -> new TopicFrame(true).id(TopicsSDGs.code(n)));
    }

    private Optional<URI> badge(final CSVRecord record) {
        return value(record, "Badge", URIs::fuzzy);
    }

    private Optional<URI> url(final CSVRecord record) {
        return value(record, "URL (English)", URIs::fuzzy)
                .or(() -> value(record, "URL (Local)", URIs::fuzzy));
    }

    private Optional<Map<Locale, String>> syllabus(final CSVRecord record) {
        return value(record, "Syllabus")
                .map(v -> map(entry(EN, v)));
    }

    private Optional<Map<Locale, String>> prerequisites(final CSVRecord record) {
        return value(record, "Prerequisites")
                .map(v -> map(entry(EN, v)));
    }

    private Stream<Test> test(final CSVRecord record) {
        return value(record, "Test").stream()
                .flatMap(v -> split(v, ","))
                .map(value -> switch ( value ) {

                    case "written" -> Test.WrittenTest;
                    case "quiz" -> Test.QuizTest;
                    case "oral" -> Test.OralTest;
                    case "coursework" -> Test.CourseworkTest;

                    default -> null;

                })
                .flatMap(Stream::ofNullable);
    }

    private Stream<Grade> grade(final CSVRecord record) {
        return value(record, "Grade").stream()
                .flatMap(v -> split(v, ","))
                .map(value -> switch ( value ) {

                    case "vote" -> Grade.VoteGrade;
                    case "judgement" -> Grade.JudgementGrade;

                    default -> null;

                })
                .flatMap(Stream::ofNullable);
    }

    private Optional<String> scale(final CSVRecord record) {
        return value(record, "Scale")
                .filter(SCALE_PATTERN.asMatchPredicate());
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Duration hours(final double value) {

        final long hours=round(floor(value));
        final long minutes=round(floor(60*value));

        return minutes == 0 ? Duration.ofHours(hours) : Duration.ofHours(hours).plus(Duration.ofMinutes(minutes));
    }

}
