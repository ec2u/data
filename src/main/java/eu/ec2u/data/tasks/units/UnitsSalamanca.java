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
import com.metreeca.rdf4j.actions.Update;

import eu.ec2u.data.cities.Salamanca;
import eu.ec2u.data.terms.EC2U;
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


    private static final Pattern HeadPattern=Pattern.compile("\\s*(.*)\\s*,\\s*(.*)\\s*");


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
                                        +"\n"
                                        +"delete { ?s ?p ?o } where {\n"
                                        +"\n"
                                        +"\t?s ?p ?o; a ec2u:Unit; ec2u:university $university\n"
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
                        .header("Accept", JSON.MIME)
                ))

                .map(JSONPath::new)
                .flatMap(json -> json.paths("*"));
    }

    private Optional<Frame> unit(final JSONPath json) {
        return json.string("id").map(id -> {

            final Optional<Literal> label=json.string("name")
                    .filter(not(String::isEmpty))
                    .map(name -> literal(name, Salamanca.Language));

            return frame(iri(EC2U.units, md5(Salamanca.University+"@"+id)))

                    .value(RDF.TYPE, EC2U.Unit)

                    .value(EC2U.university, Salamanca.University)
                    .value(ORG.UNIT_OF, Salamanca.University)

                    .value(RDFS.LABEL, label)
                    .value(RDFS.COMMENT, json.string("topics")
                            .filter(not(String::isEmpty))
                            .map(topics -> literal(topics, Salamanca.Language))
                    )

                    .value(SKOS.PREF_LABEL, label)
                    .value(SKOS.ALT_LABEL, json.string("acronym")
                            .filter(not(String::isEmpty))
                            .map(value -> literal(value, Salamanca.Language)))

                    .frame(inverse(ORG.HEAD_OF), head(json));
        });
    }

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

}
