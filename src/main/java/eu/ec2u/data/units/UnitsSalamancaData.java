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

package eu.ec2u.data.units;

import com.metreeca.flow.actions.Fill;
import com.metreeca.flow.actions.GET;
import com.metreeca.flow.json.JSONPath;
import com.metreeca.flow.json.formats.JSON;
import com.metreeca.flow.rdf4j.actions.Upload;
import com.metreeca.flow.services.Vault;
import com.metreeca.flow.work.Xtream;
import com.metreeca.link.Frame;

import eu.ec2u.data.persons.Persons;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Literal;
import org.eclipse.rdf4j.model.vocabulary.*;

import java.time.Instant;
import java.util.Base64;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.services.Vault.vault;
import static com.metreeca.flow.toolkits.Strings.split;
import static com.metreeca.link.Frame.*;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.EC2U.item;
import static eu.ec2u.data.concepts.OrganizationTypes.*;
import static eu.ec2u.data.resources.Resources.university;
import static eu.ec2u.data.units.Units.ResearchTopics;
import static eu.ec2u.data.units.Units.Unit;
import static eu.ec2u.data.universities.University.Salamanca;
import static java.lang.String.format;
import static java.nio.charset.StandardCharsets.UTF_8;
import static java.util.function.Predicate.not;

public final class UnitsSalamancaData implements Runnable {

    private static final IRI Context=iri(Units.Context, "/salamanca/data");

    private static final String APIUrl="units-salamanca-url"; // vault label
    private static final String APIKey="units-salamanca-key"; // vault label


    private static final Pattern HeadPattern=Pattern.compile("\\s*(.*)\\s*,\\s*(.*)\\s*");


    public static void main(final String... args) {
        exec(() -> new UnitsSalamancaData().run());
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final Vault vault=service(vault());


    @Override public void run() {
        Xtream.of(Instant.EPOCH)

                .flatMap(this::units)
                .optMap(this::unit)

                .flatMap(Frame::stream)
                .batch(0)

                .forEach(new Upload()
                        .contexts(Context)
                        .clear(true)
                );
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Xtream<JSONPath> units(final Instant updated) {

        final String url=vault.get(APIUrl);
        final String key=service(vault()).get(APIKey);

        return Xtream.of(updated)

                .flatMap(new Fill<>()
                        .model(url)
                )

                .optMap(new GET<>(new JSON(), request -> request
                        .header("Authorization", format("Basic %s",
                                Base64.getEncoder().encodeToString(key.getBytes(UTF_8))
                        ))
                ))

                .map(JSONPath::new)
                .flatMap(json -> json.paths("*"));
    }

    private Optional<Frame> unit(final JSONPath json) {
        return json.string("id").map(id -> {

            final Optional<Literal> label=json.string("name")
                    .filter(not(String::isEmpty))
                    .map(name -> literal(name, Salamanca.language));

            final Optional<Frame> department=department(json);
            final Optional<Frame> institute=institute(json);

            return frame(

                    field(ID, item(Units.Context, Salamanca, id)),

                    field(RDF.TYPE, Unit),
                    field(university, Salamanca.id),

                    field(DCTERMS.TITLE, label),
                    field(DCTERMS.DESCRIPTION, json.string("topics")
                            .filter(not(String::isEmpty))
                            .map(topics -> literal(topics, Salamanca.language))
                    ),


                    field(DCTERMS.SUBJECT, json.string("knowledge_branch").stream() // !!! EuroSciVoc
                            .flatMap(v -> split(v, "[,;]"))
                            .map(v -> frame(
                                    field(ID, item(ResearchTopics, Salamanca, "branch: "+v)),
                                    field(RDF.TYPE, SKOS.CONCEPT),
                                    field(SKOS.TOP_CONCEPT_OF, ResearchTopics),
                                    field(SKOS.PREF_LABEL, literal(v, Salamanca.language))

                            ))
                    ),

                    field(DCTERMS.SUBJECT, json.string("RIS3").stream() // !!! EuroSciVoc
                            .flatMap(v -> split(v, "[,;]"))
                            .map(v -> frame(
                                    field(ID, item(ResearchTopics, Salamanca, "ris3"+v)),
                                    field(RDF.TYPE, SKOS.CONCEPT),
                                    field(SKOS.TOP_CONCEPT_OF, ResearchTopics),
                                    field(SKOS.PREF_LABEL, literal(v, Salamanca.language))
                            ))
                    ),

                    field(FOAF.HOMEPAGE, json.string("group_scientific_portal_url")
                            .filter(not(String::isEmpty))
                            .map(Frame::iri)
                    ),

                    field(SKOS.PREF_LABEL, label),
                    field(SKOS.ALT_LABEL, json.string("acronym")
                            .filter(not(String::isEmpty))
                            .map(value -> literal(value, Salamanca.language))),

                    field(ORG.CLASSIFICATION, GroupRecognized),

                    field(reverse(ORG.HEAD_OF), head(json)),

                    field(ORG.UNIT_OF, department.orElseGet(
                            () -> frame(field(ID, Salamanca.id))
                    )),

                    field(ORG.UNIT_OF, department),
                    field(ORG.UNIT_OF, institute),

                    field(ORG.UNIT_OF, Optional.of(frame(field(ID, Salamanca.id)))
                            .filter(frame -> department.isEmpty() && institute.isEmpty())
                    )

            );

        });
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Optional<Frame> head(final JSONPath json) {
        return json.string("head")

                .map(HeadPattern::matcher)
                .filter(Matcher::matches)
                .map(matcher -> {

                    final String familyName=matcher.group(1);
                    final String givenName=matcher.group(2);

                    return frame(

                            field(ID, item(Persons.Context, Salamanca, format("%s, %s", familyName, givenName))),
                            field(TYPE, FOAF.PERSON),

                            field(university, Salamanca.id),

                            field(FOAF.GIVEN_NAME, literal(givenName)),
                            field(FOAF.FAMILY_NAME, literal(familyName))

                    );
                });
    }

    private Optional<Frame> department(final JSONPath json) {
        return json.string("department").map(name -> {

            final Literal title=literal(name, Salamanca.language);

            return frame(

                    field(ID, item(Units.Context, Salamanca, name)),

                    field(RDF.TYPE, Unit),
                    field(university, Salamanca.id),

                    field(DCTERMS.TITLE, title),
                    field(SKOS.PREF_LABEL, title),

                    field(FOAF.HOMEPAGE, json.string("department_web_usal_url").map(Frame::iri)),
                    field(FOAF.HOMEPAGE, json.string("department_scientific_portal_url").map(Frame::iri)),

                    field(ORG.CLASSIFICATION, Department),
                    field(ORG.UNIT_OF, Salamanca.id)

            );
        });
    }

    private Optional<Frame> institute(final JSONPath json) {
        return json.string("institute").map(name -> {

            final Literal title=literal(name, Salamanca.language);

            return frame(

                    field(ID, item(Units.Context, Salamanca, name)),

                    field(RDF.TYPE, Unit),
                    field(university, Salamanca.id),

                    field(DCTERMS.TITLE, title),
                    field(SKOS.PREF_LABEL, title),

                    field(FOAF.HOMEPAGE, json.string("institute_webusal_url").stream()
                            .flatMap(v -> split(v, ','))
                            .map(Frame::iri)
                    ),

                    field(ORG.CLASSIFICATION, Institute),
                    field(ORG.UNIT_OF, Salamanca.id)

            );
        });
    }

}
