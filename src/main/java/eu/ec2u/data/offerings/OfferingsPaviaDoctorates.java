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

import com.metreeca.http.actions.GET;
import com.metreeca.http.json.JSONPath;
import com.metreeca.http.json.services.Analyzer;
import com.metreeca.http.rdf4j.actions.Upload;
import com.metreeca.http.work.Xtream;
import com.metreeca.http.xml.actions.Extract;
import com.metreeca.http.xml.actions.Untag;
import com.metreeca.http.xml.formats.HTML;
import com.metreeca.link.Frame;

import eu.ec2u.data.concepts.ISCED2011;
import eu.ec2u.data.programs.Programs;
import eu.ec2u.data.resources.Resources;
import eu.ec2u.data.things.Schema;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Value;

import java.util.List;

import static com.metreeca.http.Locator.service;
import static com.metreeca.http.json.services.Analyzer.analyzer;
import static com.metreeca.link.Frame.*;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.EC2U.item;
import static eu.ec2u.data.EC2U.update;
import static eu.ec2u.data.universities.University.Pavia;
import static eu.ec2u.work.xlations.Xlations.translate;
import static java.util.function.Predicate.not;

public final class OfferingsPaviaDoctorates implements Runnable {

    private static final IRI Context=iri(Offerings.Context, "/pavia/doctorates");

    private static final String PageURL="https://phd.unipv.it/la-scuola-di-alta-formazione-dottorale-di-pavia-safd/";


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    public static void main(final String... args) {
        exec(() -> new OfferingsPaviaDoctorates().run());
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final Analyzer analyzer=service(analyzer());


    @Override public void run() {

        final List<Frame> doctorates=doctorates();

        final List<Frame> details=Xtream.from(doctorates)

                .optMap(doctorate -> doctorate.value(Schema.url, asIRI()))
                .map(Value::stringValue)

                .flatMap(this::doctorate)

                .toList();

        update(connection -> Xtream

                .from(doctorates, details)

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

    private List<Frame> doctorates() {
        return Xtream.of(PageURL)

                .optMap(new GET<>(new HTML()))
                .optMap(new Extract())
                .map(new Untag())

                .optMap(analyzer.prompt("""
                        Extract from a provided markdown document describing doctorate programs:
                        - name
                        - language as guessed from name as a 2-letter ISO tag
                        - URL
                        Report as a JSON object
                        """, """
                        {
                          "name": "programs",
                          "strict": false,
                          "schema": {
                            "type": "object",
                            "properties": {
                              "programs": {
                                "type": "array",
                                "items": {
                                  "type": "object",
                                  "properties": {
                                    "name": {
                                      "type": "string"
                                    },
                                    "nameLanguage": {
                                      "type": "string"
                                    },
                                    "url": {
                                      "type": "string",
                                      "format": "uri"
                                    }
                                  },
                                  "required": [
                                    "name",
                                    "nameLanguage",
                                    "url"
                                  ]
                                }
                              }
                            },
                            "required": [
                              "programs"
                            ]
                          }
                        }
                        """
                ))

                .map(JSONPath::new).flatMap(json -> json.paths("programs.*")).map(program -> {

                    final String language=program.string("nameLanguage").orElse(Pavia.language);

                    return frame(

                            field(ID, program.string("url").map(url -> item(Programs.Context, Pavia, url))),
                            field(TYPE, Programs.EducationalOccupationalProgram),

                            field(Resources.analyzed, literal(true)),
                            field(Resources.university, Pavia.id),

                            field(Schema.name, program.string("name").map(name ->
                                    literal((language.equals(Pavia.language) ? "Dottorato in" : "Doctorate in ")+name, language)
                            )),

                            field(Schema.url, program.string("url").map(Frame::iri)),

                            field(Offerings.educationalLevel, ISCED2011.Level8),
                            field(Offerings.educationalCredentialAwarded, literal("Dottorato di Ricerca", Pavia.language))

                    );
                })

                .toList();
    }

    private Xtream<Frame> doctorate(final String url) {
        return Xtream.of(url)

                .optMap(new GET<>(new HTML()))
                .optMap(new Extract())
                .map(new Untag())

                .optMap(analyzer.prompt("""
                        Extract the following properties from the provided markdown document describing a doctoral program:

                        - document language as guessed from its content as a 2-letter ISO tag
                        - general objectives
                        - acquired competency or intended learning outcomes
                        - admission requirements (omit if not specified in the document)

                        Describe properties extensively.
                        Respond with a JSON object.
                        """, """
                        {
                                 "name": "program",
                                 "strict": false,
                                 "schema": {
                                   "type": "object",
                                   "properties": {
                                     "language": {
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
                                     "objectives",
                                     "competencies"
                                   ]
                                 }
                               }
                        """
                ))

                .map(JSONPath::new).map(program -> {

                    final String language=program.string("language").orElse(Pavia.language);

                    return frame(

                            field(ID, item(Programs.Context, Pavia, url)),

                            field(Offerings.teaches, program.string("objectives")
                                    .filter(not(String::isEmpty))
                                    .map(v -> literal(v, language))
                            ),

                            field(Offerings.assesses, program.string("competencies")
                                    .filter(not(String::isEmpty))
                                    .map(v -> literal(v, language))
                            ),

                            field(Programs.programPrerequisites, program.string("requirements")
                                    .filter(not(String::isEmpty))
                                    .map(v -> literal(v, language))
                            )

                    );
                });
    }

}
