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

package eu.ec2u.data.datasets.units;

import com.metreeca.core.Xtream;
import com.metreeca.core.actions.Fill;
import com.metreeca.core.services.Vault;
import com.metreeca.http.actions.GET;
import com.metreeca.json.JSONPath;
import com.metreeca.json.codecs.JSON;
import com.metreeca.link.Frame;
import com.metreeca.link.Values;

import eu.ec2u.data.Data;
import eu.ec2u.data._cities.Salamanca;
import eu.ec2u.data.concepts.Concepts;
import eu.ec2u.data.concepts.Units;
import eu.ec2u.data.datasets.persons.Persons;
import eu.ec2u.data.ontologies.EC2U;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Literal;
import org.eclipse.rdf4j.model.vocabulary.*;

import java.time.Instant;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static com.metreeca.core.Locator.service;
import static com.metreeca.core.services.Vault.vault;
import static com.metreeca.core.toolkits.Identifiers.md5;
import static com.metreeca.core.toolkits.Strings.split;
import static com.metreeca.link.Frame.frame;
import static com.metreeca.link.Values.*;

import static eu.ec2u.data._tasks.Tasks.upload;
import static eu.ec2u.data._tasks.Tasks.validate;
import static eu.ec2u.data.datasets.units.Units.Unit;
import static eu.ec2u.data.datasets.units.Units.clear;

import static java.lang.String.format;
import static java.nio.charset.StandardCharsets.UTF_8;
import static java.util.function.Predicate.not;

public final class UnitsSalamancaData implements Runnable {

    private static final String APIUrl="units-salamanca-url"; // vault label
    private static final String APIKey="units-salamanca-key"; // vault label

    private static final IRI BranchScheme=iri(Concepts.Context, "units-salamanca-branch/");
    private static final IRI RIS3Scheme=iri(Concepts.Context, "units-salamanca-ris3/");


    private static final Pattern HeadPattern=Pattern.compile("\\s*(.*)\\s*,\\s*(.*)\\s*");


    public static void main(final String... args) {
        Data.exec(() -> new UnitsSalamancaData().run());
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final Vault vault=service(vault());


    @Override public void run() {
        Xtream.of(Instant.EPOCH)

                .flatMap(this::units)
                .optMap(this::unit)

                .sink(units -> upload(eu.ec2u.data.datasets.units.Units.Context,
                        validate(Unit(), Set.of(EC2U.Unit), units),
                        () -> clear(Salamanca.University)
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

            return frame(EC2U.id(eu.ec2u.data.datasets.units.Units.Context, Salamanca.University, id))

                    .values(RDF.TYPE, EC2U.Unit)
                    .value(EC2U.university, Salamanca.University)

                    .value(DCTERMS.TITLE, label)
                    .value(DCTERMS.DESCRIPTION, json.string("topics")
                            .filter(not(String::isEmpty))
                            .map(topics -> literal(topics, Salamanca.Language))
                    )


                    .frames(DCTERMS.SUBJECT, json.string("knowledge_branch").stream()
                            .flatMap(v -> split(v, ','))
                            .map(v -> frame(iri(BranchScheme, md5(v)))
                                    .value(RDF.TYPE, SKOS.CONCEPT)
                                    .value(SKOS.PREF_LABEL, literal(v, Salamanca.Language))

                            )
                    )

                    .frames(DCTERMS.SUBJECT, json.string("RIS3").stream()
                            .flatMap(v -> split(v, ','))
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

                    return frame(EC2U.id(Persons.Context, Salamanca.University, fullName))

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

            return frame(EC2U.id(eu.ec2u.data.datasets.units.Units.Context, Salamanca.University, name))

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

            return frame(EC2U.id(eu.ec2u.data.datasets.units.Units.Context, Salamanca.University, name))

                    .values(RDF.TYPE, EC2U.Unit)
                    .value(EC2U.university, Salamanca.University)

                    .value(DCTERMS.TITLE, title)
                    .value(SKOS.PREF_LABEL, title)

                    .values(FOAF.HOMEPAGE, json.string("institute_webusal_url").stream()
                            .flatMap(v -> split(v, ','))
                            .map(Values::iri))

                    .value(ORG.CLASSIFICATION, Units.Institute)
                    .frame(ORG.UNIT_OF, frame(Salamanca.University));
        });
    }

}
