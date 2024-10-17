/*
 * Copyright © 2020-2024 EC2U Alliance
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

import com.metreeca.http.rdf4j.actions.Upload;
import com.metreeca.http.services.Vault;
import com.metreeca.http.toolkits.Strings;
import com.metreeca.http.work.Xtream;
import com.metreeca.link.Frame;

import eu.ec2u.data.concepts.ISCED2011;
import eu.ec2u.data.concepts.ISCEDF2013;
import eu.ec2u.data.courses.Courses;
import eu.ec2u.data.events.Events;
import eu.ec2u.data.persons.Persons;
import eu.ec2u.data.things.Schema;
import eu.ec2u.data.universities.University;
import eu.ec2u.work.feeds.CSVProcessor;
import eu.ec2u.work.feeds.Parsers;
import org.apache.commons.csv.CSVRecord;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Literal;
import org.eclipse.rdf4j.model.vocabulary.FOAF;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.eclipse.rdf4j.model.vocabulary.XSD;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.Locale;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Stream;

import static com.metreeca.http.Locator.service;
import static com.metreeca.http.services.Vault.vault;
import static com.metreeca.link.Frame.*;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.EC2U.item;
import static eu.ec2u.data.EC2U.update;
import static eu.ec2u.data.courses.Courses.*;
import static eu.ec2u.data.events.Events.EventAttendanceModeEnumeration.*;
import static eu.ec2u.data.resources.Resources.partner;
import static java.lang.String.format;
import static java.util.function.Predicate.not;

public final class OfferingsLLL extends CSVProcessor<Frame> implements Runnable {

    private static final IRI Context=iri(Offerings.Context, "/lll");

    private static final String DataUrl="offerings-lll-url"; // vault label


    public static void main(final String... args) {
        exec(() -> new OfferingsLLL().run());
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final Vault vault=service(vault());


    @Override public void run() {

        final String url=vault
                .get(DataUrl)
                .orElseThrow(() -> new IllegalStateException(format(
                        "undefined data URL <%s>", DataUrl
                )));

        update(connection -> Xtream.of(url)

                .flatMap(this)

                .flatMap(Frame::stream)
                .batch(0)

                .forEach(new Upload()
                        .contexts(Context)
                        .clear(true)
                )

        );
    }

    @Override protected Optional<Frame> process(final CSVRecord record, final Collection<CSVRecord> records) {

        final Optional<String> titleOriginal=value(record, "Course Title (original)");
        final Optional<String> titleEnglish=value(record, "Course Title (in English)");

        return university(record).flatMap(university -> id(record, university).map(id -> frame(

                field(ID, id),

                field(RDF.TYPE, Course, CourseInstance),

                field(partner, university.id),

                field(Events.audience, literal("Lifelong Learner")), // !!! review

                // !!! Department (in English)

                field(Offerings.educationalLevel, value(record, "Study Course Level (BA/MA/Postgraduate)")
                        .map(v -> v.equals("BA") ? ISCED2011.Level6
                                : v.equals("MA") ? ISCED2011.Level7
                                : v.equals("Postgraduate") ? ISCED2011.Level8
                                : ISCED2011.Level9
                        )
                ),

                // !!! Study degree course (in English)

                field(courseCode, value(record, "University Course code").map(Frame::literal)),

                field(Schema.name, titleOriginal
                        .filter(not(title -> title.equals(titleEnglish.orElse(""))))
                        .map(name -> literal(name, university.language))
                ),

                field(Schema.name, titleEnglish.map(name -> literal(name, "en"))),

                field(Schema.isAccessibleForFree, value(record, "Fee to attend this course for external users (Yes/No)")
                        .map(value -> literal(value.equalsIgnoreCase("no")))),

                // !!! Semester (First/Second)

                field(Courses.timeRequired, value(record, "Teaching hours", Parsers::decimal)
                        .map(OfferingsLLL::duration)
                ),

                field(courseWorkload, value(record, "Individual study hours", Parsers::decimal)
                        .map(OfferingsLLL::duration)
                ),

                // !!! Test type (Written/Oral/Both)
                // !!! Type evaluation (Vote/Judgement)
                // !!! Description type evaluation (If it is a vote write the range in numbers, e.g. 0-30)

                field(instructor, value(record, "Professor Surname").flatMap(surname -> // !!!
                        value(record, "Professor First Name").map(forename -> frame(

                                field(ID, item(Persons.Context, university, format("%s, %s", surname, forename))),
                                field(TYPE, FOAF.PERSON),

                                field(partner, university.id),

                                field(FOAF.GIVEN_NAME, literal(forename)),
                                field(FOAF.FAMILY_NAME, literal(surname))

                        ))
                )),

                // !!! Academic year in which the course is being offered

                field(Schema.inLanguage, value(record, "Course Language").stream()
                        .flatMap(Parsers::languages)
                        .map(Frame::literal)),

                // !!! SDG Number (if SDGs related)

                field(courseMode, value(record, "Teaching method (on-line/ in presence/ hybrid)")
                        .map(mode -> mode.toUpperCase(Locale.ROOT))
                        .map(mode -> mode.contains("LINE") ? OnlineEventAttendanceMode
                                : mode.contains("PRESENCE") || mode.contains("SITE") ? OfflineEventAttendanceMode
                                : mode.contains("HYBRID") ? MixedEventAttendanceMode
                                : null
                        )
                ),

                field(Offerings.teaches, value(record, "Short syllabus (max 100 words)")
                        .map(v -> literal(v, "en"))
                ),

                field(Courses.coursePrerequisites, value(record, "Prerequisites\n"+
                        "(Fill if you answered YES at Col.I. Use no more than 30 words)")
                        .filter(not(v -> v.equalsIgnoreCase("none")))
                        .map(v -> literal(v, "en"))
                ),


                field(Schema.about, value(record, "Narrow field number classification of the course according to ISCED table https://uis.unesco.org/sites/default/files/documents/isced-fields-of-education-and-training-2013-en.pdf").stream()
                        .flatMap(this::subjects) // !!! only if detailed field is not provided
                ),

                field(Schema.about, value(record, "If available write the Detailed field number classification of the course according to ISCED table https://uis.unesco.org/sites/default/files/documents/isced-fields-of-education-and-training-2013-en.pdf    ").stream()
                        .flatMap(this::subjects)
                ),

                field(Offerings.numberOfCredits, value(record, "Number of ECTS", Parsers::decimal)
                        .map(Frame::literal)
                ),

                field(Schema.url, value(record, "Link to the course site/description", Parsers::url)
                        .map(Frame::iri)
                )

        )));

    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Optional<University> university(final CSVRecord record) {

        final Optional<University> university=value(record, "University").map(University::valueOf);

        if ( university.isEmpty() ) {
            warning(record, "no university name provided");
        }

        return university;
    }

    private Optional<IRI> id(final CSVRecord record, final University university) { // !!! enforce uniqueness

        final Optional<String> identifier=value(record, "University Course code");
        final Optional<String> titleEnglish=value(record, "Course Title (in English)");
        final Optional<String> titleLocal=value(record, "Course Title (original)");

        if ( titleEnglish.isEmpty() && titleLocal.isEmpty() ) {

            warning(record, "no english/local title provided");

            return Optional.empty();

        } else {

            return Optional.of(item(Courses.Context, university, identifier
                    .or(() -> titleEnglish)
                    .or(() -> titleLocal)
                    .orElse("") // unexpected
            ));

        }
    }

    private Stream<IRI> subjects(final String text) {
        return Stream.of(text)
                .flatMap(Strings::split)
                .map(v -> Pattern.compile("^\\s*(\\d+)").matcher(v)) // remove trailing description
                .filter(Matcher::find)
                .map(matcher -> matcher.group(1))
                .map(code -> format("%s/%s", ISCEDF2013.Scheme, code)) // !!! validate
                .map(Frame::iri);
    }

    private static Literal duration(final BigDecimal value) {

        final int hours=value.intValue();
        final int minutes=value.remainder(BigDecimal.ONE).multiply(new BigDecimal(60)).intValue();

        return literal(
                minutes == 0 ? format("PT%dH", hours) : format("PT%dH%dM", hours, minutes),
                XSD.DURATION);
    }

}
