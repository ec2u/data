/*
 * Copyright © 2020-2022 EC2U Alliance
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

package eu.ec2u.data.tasks.units;

import com.metreeca.http.Xtream;
import com.metreeca.http.actions.Fill;
import com.metreeca.http.actions.GET;
import com.metreeca.http.services.Vault;
import com.metreeca.json.JSONPath;
import com.metreeca.json.codecs.JSON;
import com.metreeca.link.Frame;
import com.metreeca.link.Values;
import com.metreeca.rdf4j.actions.Update;

import eu.ec2u.data.cities.Salamanca;
import eu.ec2u.data.terms.EC2U;
import eu.ec2u.data.terms.Units;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Literal;
import org.eclipse.rdf4j.model.vocabulary.*;

import java.time.Instant;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Stream;

import static com.metreeca.core.Identifiers.md5;
import static com.metreeca.core.Lambdas.task;
import static com.metreeca.http.Locator.service;
import static com.metreeca.http.services.Vault.vault;
import static com.metreeca.link.Frame.frame;
import static com.metreeca.link.Values.*;
import static com.metreeca.rdf4j.services.Graph.graph;

import static eu.ec2u.data.ports.Units.Unit;
import static eu.ec2u.data.tasks.Tasks.*;

import static java.lang.String.format;
import static java.nio.charset.StandardCharsets.UTF_8;
import static java.util.function.Predicate.not;

public final class UnitsSalamanca implements Runnable {

    private static final String APIUrl="units-salamanca-url"; // vault label
    private static final String APIKey="units-salamanca-key"; // vault label

    private static final IRI BranchScheme=iri(EC2U.concepts, "units-salamanca-branch/");
    private static final IRI RIS3Scheme=iri(EC2U.concepts, "units-salamanca-ris3/");


    private static final Pattern HeadPattern=Pattern.compile("\\s*(.*)\\s*,\\s*(.*)\\s*");
    private static final Pattern SeparatorPattern=Pattern.compile("\\s*[,;]\\s*");


    public static void main(final String... args) {
        exec(() -> new UnitsSalamanca().run());
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final Vault vault=service(vault());


    @Override public void run() {
        Xtream.of(Instant.EPOCH)

                .flatMap(this::units)
                .optMap(this::unit)

                .sink(units -> upload(EC2U.units,
                        validate(Unit(), Set.of(EC2U.Unit), units),
                        () -> service(graph()).update(task(connection -> Stream

                                .of(""
                                        +"prefix ec2u: </terms/>\n"
                                        +"prefix org: <http://www.w3.org/ns/org#>\n"
                                        +"\n"
                                        +"delete {\n"
                                        +"\n"
                                        +"\t?u ?p ?o.\n"
                                        +"\t?h org:headOf ?u.\n"
                                        +"\t\n"
                                        +"} where {\n"
                                        +"\n"
                                        +"\t?u a ec2u:Unit;\n"
                                        +"\t\tec2u:university $university.\n"
                                        +"\n"
                                        +"\toptional { ?u ?p ?o }\n"
                                        +"\toptional { ?h org:headOf ?u }\n"
                                        +"\n"
                                        +"}"
                                )

                                .forEach(new Update()
                                        .base(EC2U.Base)
                                        .binding("university", Salamanca.University)
                                )

                        ))
                ));
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Xtream<JSONPath> units(final Instant synced) {

        final String url=vault
                .get(APIUrl)
                .orElseThrow(() -> new IllegalStateException(format(
                        "undefined API URL <%s>", APIUrl
                )));

        final String key=service(vault())
                .get(APIKey)
                .orElseThrow(() -> new IllegalStateException(format(
                        "undefined API key <%s>", APIKey
                )));

        return Xtream.of(synced)

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
                    .map(name -> literal(name, Salamanca.Language));

            final Optional<Frame> department=department(json);
            final Optional<Frame> institute=institute(json);

            return frame(iri(EC2U.units, md5(Salamanca.University+"@"+id)))

                    .values(RDF.TYPE, EC2U.Unit)
                    .value(EC2U.university, Salamanca.University)

                    .value(DCTERMS.TITLE, label)
                    .value(DCTERMS.DESCRIPTION, json.string("topics")
                            .filter(not(String::isEmpty))
                            .map(topics -> literal(topics, Salamanca.Language))
                    )


                    .frames(DCTERMS.SUBJECT, json.string("knowledge_branch").stream()
                            .flatMap(v -> Arrays.stream(SeparatorPattern.split(v)))
                            .filter(not(String::isEmpty))
                            .map(v -> frame(iri(BranchScheme, md5(v)))
                                    .value(RDF.TYPE, SKOS.CONCEPT)
                                    .value(SKOS.PREF_LABEL, literal(v, Salamanca.Language))

                            )
                    )

                    .frames(DCTERMS.SUBJECT, json.string("RIS3").stream()
                            .flatMap(v -> Arrays.stream(SeparatorPattern.split(v)))
                            .filter(not(String::isEmpty))
                            .map(v -> frame(iri(RIS3Scheme, md5(v)))
                                    .value(RDF.TYPE, SKOS.CONCEPT)
                                    .value(SKOS.PREF_LABEL, literal(v, Salamanca.Language))

                            )
                    )

                    .value(FOAF.HOMEPAGE, json.string("group_scientific_portal_url")
                            .filter(not(String::isEmpty))
                            .map(Values::iri)
                    )

                    .value(SKOS.PREF_LABEL, label)
                    .value(SKOS.ALT_LABEL, json.string("acronym")
                            .filter(not(String::isEmpty))
                            .map(value -> literal(value, Salamanca.Language)))

                    .value(ORG.CLASSIFICATION, Units.GroupRecognized)

                    .frame(inverse(ORG.HEAD_OF), head(json))

                    .frame(ORG.UNIT_OF, department.orElseGet(
                            () -> frame(Salamanca.University)
                    ))

                    .frame(ORG.UNIT_OF, department)
                    .frame(ORG.UNIT_OF, institute)

                    .frame(ORG.UNIT_OF, Optional.of(frame(Salamanca.University))
                            .filter(frame -> department.isEmpty() && institute.isEmpty())
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
                    final String fullName=format("%s %s", givenName, familyName);

                    return frame(iri(EC2U.persons, md5(Salamanca.University+"@"+fullName)))

                            .value(RDF.TYPE, EC2U.Person)

                            .value(RDFS.LABEL, literal(fullName, Salamanca.Language))

                            .value(EC2U.university, Salamanca.University)

                            .value(FOAF.GIVEN_NAME, literal(givenName))
                            .value(FOAF.FAMILY_NAME, literal(familyName));

                });
    }

    private Optional<Frame> department(final JSONPath json) {
        return json.string("department").map(name -> {

            final Literal title=literal(name, Salamanca.Language);

            return frame(iri(EC2U.units, md5(Salamanca.University+"@"+name)))

                    .values(RDF.TYPE, EC2U.Unit)
                    .value(EC2U.university, Salamanca.University)

                    .value(DCTERMS.TITLE, title)
                    .value(SKOS.PREF_LABEL, title)

                    .value(FOAF.HOMEPAGE, json.string("department_web_usal_url").map(Values::iri))
                    .value(FOAF.HOMEPAGE, json.string("department_scientific_portal_url").map(Values::iri))

                    .value(ORG.CLASSIFICATION, Units.Department)
                    .frame(ORG.UNIT_OF, frame(Salamanca.University));
        });
    }

    private Optional<Frame> institute(final JSONPath json) {
        return json.string("institute").map(name -> {

            final Literal title=literal(name, Salamanca.Language);

            return frame(iri(EC2U.units, md5(Salamanca.University+"@"+name)))

                    .values(RDF.TYPE, EC2U.Unit)
                    .value(EC2U.university, Salamanca.University)

                    .value(DCTERMS.TITLE, title)
                    .value(SKOS.PREF_LABEL, title)

                    .values(FOAF.HOMEPAGE, json.string("institute_webusal_url").stream()
                            .flatMap(v -> Arrays.stream(SeparatorPattern.split(v)))
                            .filter(not(String::isEmpty))
                            .map(Values::iri))

                    .value(ORG.CLASSIFICATION, Units.Institute)
                    .frame(ORG.UNIT_OF, frame(Salamanca.University));
        });
    }

}
