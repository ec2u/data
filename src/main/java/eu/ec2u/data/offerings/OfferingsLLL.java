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

package eu.ec2u.data.offerings;

import com.metreeca.flow.services.Logger;
import com.metreeca.flow.services.Vault;
import com.metreeca.mesh.Value;
import com.metreeca.mesh.tools.Store;
import com.metreeca.shim.Locales;
import com.metreeca.shim.URIs;

import eu.ec2u.data.courses.CourseFrame;
import eu.ec2u.data.events.SchemaEvent;
import eu.ec2u.data.persons.PersonFrame;
import eu.ec2u.data.taxonomies.TopicFrame;
import eu.ec2u.data.universities.University;
import eu.ec2u.work.CSVProcessor;
import org.apache.commons.csv.CSVRecord;

import java.net.URI;
import java.util.Collection;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Matcher;
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
import static com.metreeca.shim.URIs.uri;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.courses.Course.review;
import static eu.ec2u.data.courses.Courses.COURSES;
import static eu.ec2u.data.events.SchemaEvent.EventAttendanceModeEnumeration.*;
import static eu.ec2u.data.persons.Persons.PERSONS;
import static eu.ec2u.data.resources.Localized.EN;
import static eu.ec2u.data.taxonomies.EC2UStakeholders.EC2U_STAKEHOLDERS;
import static eu.ec2u.data.taxonomies.ISCED2011.*;
import static eu.ec2u.data.taxonomies.SDGs.SDGS;
import static eu.ec2u.data.universities.Universities.UNIVERSITIES;
import static eu.ec2u.data.universities.University.PARTNERS;
import static eu.ec2u.data.universities.University.uuid;
import static java.lang.String.format;
import static java.util.Locale.ROOT;
import static java.util.function.Predicate.not;

public final class OfferingsLLL extends CSVProcessor<CourseFrame> implements Runnable {

    private static final String DATA_URL="offerings-lll-url"; // vault label

    private static final TopicFrame LLL=new TopicFrame(true).id(
            uri("%s/%s".formatted(EC2U_STAKEHOLDERS.id(), "teaching/students/continuing-education"))
    );


    private static final Pattern FuzzyDecimalPattern=Pattern.compile("^\\s*(\\d+(?:\\.\\d+)?)");


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

        time(() -> store.modify(

                array(Stream.of(url)
                        .flatMap(this)
                ),

                Value.value(query(new CourseFrame(true))
                        .where("seeAlso", criterion().any(uri(LLL.id()))) // ;( hack to clear the LL set
                )

        )).apply((elapsed, resources) -> logger.info(this, format(
                "synced <%,d> resources in <%,d> ms", resources, elapsed
        )));

    }

    @Override
    protected Stream<CourseFrame> process(final CSVRecord record, final Collection<CSVRecord> records) {
        return university(record).flatMap(university -> id(record, university)
                .filter(id -> value(record, "Disabled").filter(not(String::isBlank)).isEmpty())
                .map(id -> new CourseFrame()

                        .id(id)
                        .university(university)

                        .audience(set(LLL))
                        .seeAlso(set(LLL.id())) // ;( tag course as in the LLL set

                        // !!! Department (in English)

                        .educationalLevel(educationalLevel(record).orElse(null))

                        // !!! Study degree course (in English)

                        .courseCode(value(record, "University Course code").orElse(null))

                        .name(map(name(record, university)))

                        .isAccessibleForFree(isAccessibleForFree(record).orElse(null))

                        // !!! Semester (First/Second)

                        // !!! .timeRequired(timeRequired(record).orElse(null))
                        // !!! .courseWorkload(courseWorkload(record).orElse(null))

                        // !!! Test type (Written/Oral/Both)
                        // !!! Type evaluation (Vote/Judgement)
                        // !!! Description type evaluation (If it is a vote write the range in numbers, e.g. 0-30)

                        .instructor(instructor(record, university).orElse(null)) // !!! linked record

                        // !!! Academic year in which the course is being offered

                        .inLanguage(set(inLanguage(record).stream()))

                        .about(set(sdgs(record)))

                        // .about(value(record, "Narrow field number classification of the course according to ISCED table https://uis.unesco.org/sites/default/files/documents/isced-fields-of-education-and-training-2013-en.pdf").stream()
                        //         .flatMap(this::subjects) // !!! only if detailed field is not provided
                        // )
                        //
                        // .about(value(record, "If available write the Detailed field number classification of the course according to ISCED table https://uis.unesco.org/sites/default/files/documents/isced-fields-of-education-and-training-2013-en.pdf    ").stream()
                        //         .flatMap(this::subjects)
                        // )

                        .courseMode(courseMode(record).orElse(null))

                        .teaches(teaches(record).orElse(null))
                        .coursePrerequisites(coursePrerequisites(record).orElse(null))

                        .numberOfCredits(numberOfCredits(record).orElse(null))
                        .url(set(url(record).stream()))

                )
                .flatMap(c -> review(c, university.locale()))
        ).stream();
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

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

    private Optional<URI> id(final CSVRecord record, final University university) { // !!! enforce uniqueness

        final Optional<String> identifier=value(record, "University Course code");
        final Optional<String> titleEnglish=value(record, "Course Title (in English)");
        final Optional<String> titleLocal=value(record, "Course Title (original)");

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

    private Optional<TopicFrame> educationalLevel(final CSVRecord record) {
        return value(record, "Study Course Level (BA/MA/Postgraduate)")
                .map(v -> v.equals("BA") ? LEVEL_6
                        : v.equals("MA") ? LEVEL_7
                        : v.equals("Postgraduate") ? LEVEL_8
                        : LEVEL_9
                );
    }

    private Stream<Map.Entry<Locale, String>> name(final CSVRecord record, final University university) {
        return Stream.concat(
                value(record, "Course Title (in English)").map(v -> entry(EN, v)).stream(),
                value(record, "Course Title (original)").map(v -> entry(university.locale(), v)).stream()
        );
    }

    private Optional<Boolean> isAccessibleForFree(final CSVRecord record) {
        return value(record, "Fee to attend this course for external users (Yes/No)")
                .map(value -> value.equalsIgnoreCase("no"));
    }

    // private Optional<Object> timeRequired(final CSVRecord record) {
    //     return value(record, "Teaching hours", Parsers::decimal)
    //             .map(OfferingsLLL::duration);
    // }

    // private Optional<Object> courseWorkload(final CSVRecord record) {
    //     return value(record, "Individual study hours", Parsers::decimal)
    //             .map(OfferingsLLL::duration);
    // }

    private Optional<PersonFrame> instructor(final CSVRecord record, final University university) {
        return value(record, "Professor Surname")
                .flatMap(surname ->
                        value(record, "Professor First Name").map(forename -> new PersonFrame()

                                .id(PERSONS.id().resolve(uuid(university, format("%s, %s", surname, forename))))
                                .university(university)

                                .givenName(forename)
                                .familyName(surname)

                        )
                );
    }

    private Optional<String> inLanguage(final CSVRecord record) {
        return value(record, "Course Language")
                .flatMap(Locales::fuzzy)
                .map(Locale::getLanguage);
    }

    private Stream<TopicFrame> sdgs(final CSVRecord record) {
        return values(record, "SDG Number (if SDGs related)", lenient(Integer::valueOf))
                .map(n -> new TopicFrame(true).id(uri("%s/%s".formatted(SDGS.id(), n))));
    }

    private Optional<SchemaEvent.EventAttendanceModeEnumeration> courseMode(final CSVRecord record) {
        return value(record, "Teaching method (on-line/ in presence/ hybrid)")
                .map(mode -> mode.toUpperCase(ROOT))
                .map(mode -> mode.contains("LINE") ? OnlineEventAttendanceMode
                        : mode.contains("PRESENCE") || mode.contains("SITE") ? OfflineEventAttendanceMode
                        : mode.contains("HYBRID") ? MixedEventAttendanceMode
                        : null
                );
    }

    private Optional<Map<Locale, String>> teaches(final CSVRecord record) {
        return value(record, "Short syllabus (max 100 words)")
                .map(v -> map(entry(EN, v)));
    }

    private Optional<Map<Locale, String>> coursePrerequisites(final CSVRecord record) {
        return value(record, "Prerequisites\n(Fill if you answered YES at Col.I. Use no more than 30 words)")
                .filter(not(v -> v.equalsIgnoreCase("none")))
                .map(v -> map(entry(EN, v)));
    }

    private Optional<Double> numberOfCredits(final CSVRecord record) {
        return value(record, "Number of ECTS", text -> Optional.of(text)

                .map(FuzzyDecimalPattern::matcher)
                .filter(Matcher::find)
                .map(matcher -> matcher.group(1))

                .map(Double::parseDouble)
        );
    }

    private Optional<URI> url(final CSVRecord record) {
        return value(record, "Link to the course site/description", URIs::fuzzy);
    }

    // private Literal duration(final BigDecimal value) {
    //
    //     final int hours=value.intValue();
    //     final int minutes=value.remainder(BigDecimal.ONE).multiply(new BigDecimal(60)).intValue();
    //
    //     return literal(
    //             minutes == 0 ? format("PT%dH", hours) : format("PT%dH%dM", hours, minutes),
    //             XSD.DURATION
    //     );
    // }


    // private Stream<IRI> subjects(final String text) {
    //     return Stream.of(text)
    //             .flatMap(Strings::split)
    //             .map(v -> Pattern.compile("^\\s*(\\d+)").matcher(v)) // remove trailing description
    //             .filter(Matcher::find)
    //             .map(matcher -> matcher.group(1))
    //             .map(code -> format("%s/%s", ISCEDF2013.Scheme, code)) // !!! validate
    //             .map(Frame::iri);
    // }

}
