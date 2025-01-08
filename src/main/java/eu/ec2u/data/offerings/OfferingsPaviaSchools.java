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

import com.metreeca.http.actions.GET;
import com.metreeca.http.json.JSONPath;
import com.metreeca.http.json.services.Analyzer;
import com.metreeca.http.rdf4j.actions.Upload;
import com.metreeca.http.work.Xtream;
import com.metreeca.http.xml.actions.Untag;
import com.metreeca.http.xml.formats.HTML;
import com.metreeca.link.Frame;

import eu.ec2u.data.concepts.ISCED2011;
import eu.ec2u.data.programs.Programs;
import eu.ec2u.data.resources.Resources;
import eu.ec2u.data.things.Schema;
import org.eclipse.rdf4j.model.IRI;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import static com.metreeca.http.Locator.service;
import static com.metreeca.http.json.services.Analyzer.analyzer;
import static com.metreeca.link.Frame.*;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.EC2U.item;
import static eu.ec2u.data.EC2U.update;
import static eu.ec2u.data.universities.University.Pavia;
import static eu.ec2u.work.xlations.Xlations.translate;
import static java.util.function.Predicate.not;

public final class OfferingsPaviaSchools implements Runnable {

    private static final IRI Context=iri(Offerings.Context, "/pavia/schools");

    private static final Collection<String> RootURLs=List.of(
            "https://portale.unipv.it/it/didattica/post-laurea/scuole-di-specializzazione/scuole-di-specializzazione-di-area-sanitaria/scuole-di-specializzazione-laureati-medici",
            "https://portale.unipv.it/it/didattica/post-laurea/scuole-di-specializzazione/scuole-di-specializzazione-di-area-sanitaria/scuole-di-specializzazione-laureati-non-medici"
    );


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    public static void main(final String... args) {
        exec(() -> new OfferingsPaviaSchools().run());
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final Analyzer analyzer=service(analyzer());


    @Override public void run() {
        update(connection -> Xtream.from(RootURLs)

                .flatMap(this::schools)

                .flatMap(Frame::stream)
                .batch(0)

                .map(model -> translate("en", model))

                .forEach(new Upload()
                        .contexts(Context)
                        .clear(true)
                )
        );
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Xtream<Frame> schools(final String page) {
        return Xtream.of(page)

                .optMap(new GET<>(new HTML()))
                .map(new Untag())

                .optMap(analyzer.prompt("""
                        Extract the following properties from a provided markdown document describing a list
                        of specialisation schools:

                        - name
                        - general objectives
                        - acquired competency or intended learning outcomes
                        - admission requirements

                        Omit properties if not specified in the document.
                        Describe properties extensively.
                        Report as a JSON object
                        """, """
                        {
                          "name": "schools",
                          "strict": false,
                          "schema": {
                            "type": "object",
                            "properties": {
                              "schools": {
                                "type": "array",
                                "items": {
                                  "type": "object",
                                  "properties": {
                                    "name": {
                                      "type": "string"
                                    },
                                    "objectives": {
                                       "type": "string"
                                     },
                                     "competencies": {
                                       "type": "string"
                                     },
                                     "requirements": {
                                       "type": "string"
                                     }
                                  },
                                  "required": [
                                    "name"
                                  ]
                                }
                              }
                            },
                            "required": [
                              "schools"
                            ]
                          }
                        }
                        """
                ))

                .map(JSONPath::new).flatMap(json -> json.paths("schools.*")).map(school -> {

                    final Optional<String> name=school.string("name").map("Scuola di Specializzazione in %s"::formatted);

                    return frame(

                            field(ID, name.map(n -> item(Programs.Context, Pavia, "%s @ %s".formatted(n, page)))), // !!!
                            field(TYPE, Programs.EducationalOccupationalProgram),

                            field(Resources.generated, literal(true)),
                            field(Resources.university, Pavia.id),

                            field(Schema.name, name.map(n -> literal(n, Pavia.language))),

                            field(Schema.url, school.string("url").map(Frame::iri)),

                            field(Offerings.educationalLevel, ISCED2011.Level8),
                            field(Offerings.educationalCredentialAwarded, literal("Diploma di Specializzazione", Pavia.language)),

                            field(Offerings.teaches, school.string("objectives")
                                    .filter(not(String::isEmpty))
                                    .map(v -> literal(v, Pavia.language))
                            ),

                            field(Offerings.assesses, school.string("competencies")
                                    .filter(not(String::isEmpty))
                                    .map(v -> literal(v, Pavia.language))
                            ),

                            field(Programs.programPrerequisites, school.string("requirements")
                                    .filter(not(String::isEmpty))
                                    .map(v -> literal(v, Pavia.language))
                            )

                    );
                });
    }

}
