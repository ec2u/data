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

import com.metreeca.http.actions.Fill;
import com.metreeca.http.actions.GET;
import com.metreeca.http.json.JSONPath;
import com.metreeca.http.json.formats.JSON;
import com.metreeca.http.rdf4j.actions.Upload;
import com.metreeca.http.work.Xtream;
import com.metreeca.link.Frame;

import eu.ec2u.data.concepts.ISCED2011;
import eu.ec2u.data.courses.Courses;
import eu.ec2u.data.organizations.Organizations;
import eu.ec2u.data.programs.Programs;
import eu.ec2u.data.resources.Resources;
import eu.ec2u.data.things.Schema;
import eu.ec2u.data.universities.University;
import eu.ec2u.work.feeds.Parsers;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.vocabulary.ORG;
import org.eclipse.rdf4j.model.vocabulary.SKOS;

import java.time.Instant;
import java.time.LocalDate;
import java.time.Month;
import java.time.Year;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Stream;

import static com.metreeca.link.Frame.*;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.EC2U.item;
import static eu.ec2u.data.EC2U.update;
import static eu.ec2u.data.universities.University.Pavia;
import static java.util.Map.entry;
import static java.util.function.Predicate.not;

public final class OfferingsPavia implements Runnable {

    private static final IRI Context=iri(Offerings.Context, "/pavia");

    private static final String APIUrl="https://studentionline.unipv.it/e3rest/api/offerta-service-v1/offerte/";


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private static final int Limit=100;

    // https://ec2u.atlassian.net/wiki/spaces/infrastructure/pages/345407519/Knowledge+Hub+-+Offerings+-+Degree+Programs#Pavia

    private static final Map<String, IRI> CodeToLevel=Map.ofEntries(

            entry("L2", ISCED2011.Level6), // Corso di Laurea

            entry("LC5", ISCED2011.Level7), // Laurea Ciclo Unico 5 anni
            entry("LC6", ISCED2011.Level7), // Laurea Ciclo Unico 6 anni
            entry("LM", ISCED2011.Level7), // Corso di Laurea Magistrale
            entry("LM5", ISCED2011.Level7), // Laurea Magistrale Ciclo Unico 5 anni
            entry("LM6", ISCED2011.Level7), // Laurea Magistrale Ciclo Unico 6 anni
            entry("M1", ISCED2011.Level7), // Master di Primo Livello
            entry("M2", ISCED2011.Level7), // Master di Secondo Livello
            entry("CPA", ISCED2011.Level7), // Corso di Perfezionamento

            entry("D1", ISCED2011.Level8), // Corso di Dottorato di ricerca
            entry("SP2", ISCED2011.Level8), // Scuola di Specializzazione (2 anni)
            entry("SP3", ISCED2011.Level8), // Scuola di Specializzazione (3 anni)
            entry("SP4", ISCED2011.Level8), // Scuola di Specializzazione (4 anni)
            entry("SP5", ISCED2011.Level8), // Scuola di Specializzazione (5 anni)
            entry("SP6", ISCED2011.Level8), // Scuola di Specializzazione (6 anni)

            entry("FI", ISCED2011.Level9), // Formazione iniziale insegnanti
            entry("PAS", ISCED2011.Level9), // Percorso Abilitante Speciale
            entry("CS", ISCED2011.Level9) // Corso Singolo

    );


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    public static void main(final String... args) {
        exec(() -> new OfferingsPavia().run());
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    @Override public void run() {
        update(connection -> Xtream.of(Instant.now())

                .map(now -> LocalDate.ofInstant(now, Pavia.zone))

                .map(date -> date.getMonth().compareTo(Month.JULY) >= 0
                        ? Year.from(date)
                        : Year.from(date).minusYears(1)
                )

                .flatMap(this::programs)

                .flatMap(program -> Stream.concat(

                        program(program).stream(),
                        courses(program).flatMap(course -> course(course).stream())

                ))

                .flatMap(Frame::stream)
                .batch(0)

                .forEach(new Upload()
                        .contexts(Context)
                        .clear(true)
                )

        );
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Xtream<JSONPath> programs(final Year year) {
        return Xtream.of(0)

                .scan(start -> Xtream.of(start)

                        .flatMap(new Fill<>()
                                .model(APIUrl+"?aaOffId={year}&start={start}&limit={limit}")
                                .value("year", year)
                                .value("start", start)
                                .value("limit", Limit)
                        )

                        .optMap(new GET<>(new JSON()))

                        .map(JSONPath::new)
                        .map(json -> {

                            final List<JSONPath> list=json.paths("*").toList();

                            return entry(
                                    list.size() < Limit ? Stream.empty() : Stream.of(start+Limit),
                                    list.stream()
                            );

                        })
                );
    }

    private Xtream<JSONPath> courses(final JSONPath program) {
        return program.integers("aaOffId")

                .flatMap(aaOffId -> program.integers("cdsOffId")

                        .flatMap(cdsOffId -> Xtream.of(0)

                                .scan(start -> Xtream.of(start)

                                        .flatMap(new Fill<>()
                                                .model(APIUrl+"{year}/{program}/attivita?start={start}&limit={limit}")
                                                .value("year", aaOffId)
                                                .value("program", cdsOffId)
                                                .value("start", start)
                                                .value("limit", Limit)
                                        )

                                        .optMap(new GET<>(new JSON()))

                                        .map(JSONPath::new)
                                        .map(json -> {

                                            final List<JSONPath> list=json.paths("*").toList();

                                            return entry(
                                                    list.size() < Limit ? Stream.empty() : Stream.of(start+Limit),
                                                    list.stream()
                                            );

                                        })
                                )
                        )
                );
    }

    private Optional<Frame> program(final JSONPath program) {
        return program.string("cdsCod").map(code -> frame(

                // !!!  "logisticaExistsFlg": 1,
                //      offertaExistsFlg": 1,
                //      "statoAttCod": { "value": "A" },

                field(ID, item(Programs.Context, Pavia, code)),
                field(TYPE, Programs.EducationalOccupationalProgram),

                field(Resources.university, Pavia.id),

                field(Schema.identifier, literal(code)),
                field(Schema.name, program.string("cdsDes").map(v -> literal(v, Pavia.language))),

                field(Offerings.educationalLevel, program.string("tipoCorsoCod").map(CodeToLevel::get)),

                field(Offerings.provider, program.string("dipCod")
                        .filter(not("NN"::equals))
                        .map(dipCode -> frame(

                                field(ID, item(Organizations.Context, Pavia, "Dipartimento/%s".formatted(dipCode))),
                                field(TYPE, ORG.ORGANIZATIONAL_UNIT),

                                field(Resources.university, Pavia.id),

                                field(ORG.IDENTIFIER, literal(dipCode)),
                                field(SKOS.PREF_LABEL, program.string("dipDes").map(v -> literal(v, Pavia.language))),

                                field(ORG.UNIT_OF, University.Pavia.id)

                        )))

        ));
    }

    private Optional<Frame> course(final JSONPath course) {
        return course.string("chiaveAdContestualizzata.adCod").map(code -> {

            final Optional<String> courseNameEN=course.string("adDesEng");
            final Optional<String> courseNameIT=course.string("chiaveAdContestualizzata.adDes")
                    .filter(it -> courseNameEN.filter(it::equals).isEmpty());

            final Optional<String> programNameEN=course.string("cdsDesEng");
            final Optional<String> programNameIT=course.string("chiaveAdContestualizzata.cdsDes")
                    .filter(it -> programNameEN.filter(it::equals).isEmpty());

            return frame(

                    // !!! "adWebViewFlg": 1,

                    field(ID, item(Courses.Context, Pavia, code)),
                    field(TYPE, Courses.Course),

                    field(Resources.university, Pavia.id),

                    field(Courses.courseCode, literal(code)),

                    field(Schema.name, courseNameEN.map(v -> literal(v, "en"))),
                    field(Schema.name, courseNameIT.map(v -> literal(v, Pavia.language))),

                    field(Schema.inLanguage, course.strings("linguaInsDes")
                            .flatMap(Parsers::languages)
                            .map(Frame::literal)
                    ),

                    field(Schema.url, course.string("urlSitoWeb")
                            .flatMap(Parsers::url)
                            .map(Frame::iri)
                    ),

                    field(Schema.url, course.string("urlCorsoMoodle")
                            .flatMap(Parsers::url)
                            .map(Frame::iri)
                    ),

                    field(reverse(Programs.hasCourse), course.string("chiaveAdContestualizzata.cdsCod")
                            .map(programCode -> frame(

                                    field(ID, item(Programs.Context, Pavia, programCode)),
                                    field(TYPE, Programs.EducationalOccupationalProgram),

                                    field(Resources.university, Pavia.id),

                                    field(Schema.identifier, literal(programCode)),

                                    field(Schema.name, programNameEN.map(v -> literal(v, "en"))),
                                    field(Schema.name, programNameIT.map(v -> literal(v, Pavia.language)))

                            ))
                    )

            );

        });
    }

}
