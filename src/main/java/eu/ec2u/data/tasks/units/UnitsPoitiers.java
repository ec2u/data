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

import com.metreeca.core.Strings;
import com.metreeca.csv.codecs.CSV;
import com.metreeca.http.Xtream;
import com.metreeca.http.actions.GET;
import com.metreeca.http.services.Vault;
import com.metreeca.link.Frame;
import com.metreeca.link.Values;
import com.metreeca.rdf4j.actions.Update;

import eu.ec2u.data.cities.Poitiers;
import eu.ec2u.data.terms.EC2U;
import eu.ec2u.data.terms.Units;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVRecord;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Value;
import org.eclipse.rdf4j.model.vocabulary.*;
import org.eclipse.rdf4j.query.TupleQuery;

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
import static java.util.function.Predicate.not;

public final class UnitsPoitiers implements Runnable {

    private static final CSVFormat Format=CSVFormat.Builder.create()
            .setHeader()
            .setSkipHeaderRecord(true)
            .setIgnoreHeaderCase(true)
            .setNullString("")
            .build();


    private static final String DataUrl="units-poitiers-url"; // vault label

    private static final IRI TopicsScheme=iri(EC2U.concepts, "units-poitier-topics/");


    private static final Pattern HeadPattern=Pattern.compile("\\s*([- 'A-Z]+)\\s+([A-Z].*)\\s*");


    public static void main(final String... args) {
        exec(() -> new UnitsPoitiers().run());
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final Map<String, Value> types=new HashMap<>();

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
                                        .binding("university", Poitiers.University)
                                )

                        ))

                ));
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Xtream<CSVRecord> units(final Instant synced) {

        final String url=vault
                .get(DataUrl)
                .orElseThrow(() -> new IllegalStateException(format(
                        "undefined data URL <%s>", DataUrl
                )));


        return Xtream.of(url)

                .optMap(new GET<>(new CSV(Format)))

                .flatMap(Collection::stream);
    }

    private Optional<Frame> unit(final CSVRecord record) {
        return Optional.ofNullable(record.get("unit code")).map(id -> {

            final Optional<String> acronym=Optional.ofNullable(record.get("short name"))
                    .filter(not(String::isEmpty));

            final Optional<String> description=Optional.ofNullable(record.get("full name"))
                    .filter(not(String::isEmpty));

            final Optional<String> label=acronym
                    .map(a -> description.map(d -> format("%s - %s", a, d)).orElse(a))
                    .or(() -> description);

            return frame(EC2U.id(EC2U.units, Poitiers.University, id))

                    .values(RDF.TYPE, EC2U.Unit)
                    .value(EC2U.university, Poitiers.University)

                    .value(DCTERMS.TITLE, label.map(v -> literal(v, Poitiers.Language)))

                    .frames(DCTERMS.SUBJECT, Optional.ofNullable(record.get("topics")).stream()
                            .flatMap(Strings::split)
                            .map(v -> frame(iri(TopicsScheme, md5(v)))
                                    .value(RDF.TYPE, SKOS.CONCEPT)
                                    .value(SKOS.PREF_LABEL, literal(v, Poitiers.Language))
                            )
                    )

                    .value(SKOS.PREF_LABEL, label.map(v -> literal(v, Poitiers.Language)))
                    .value(SKOS.ALT_LABEL, acronym.map(v -> literal(v, Poitiers.Language)))

                    .value(FOAF.HOMEPAGE, Optional.ofNullable(record.get("website"))
                            .map(Values::iri)
                    )

                    .value(ORG.CLASSIFICATION, Optional.ofNullable(record.get("type")).flatMap(this::type))
                    .frame(inverse(ORG.HEAD_OF), head(record))

                    .value(ORG.UNIT_OF, Optional.ofNullable(record.get("parent unit"))
                            .map(id1 -> EC2U.id(EC2U.units, Poitiers.University, id1))
                            .orElse(Poitiers.University));

        });
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Optional<Value> type(final String type) {
        return Optional

                .of(types.computeIfAbsent(type, key -> service(graph()).query(connection -> {

                    final TupleQuery query=connection.prepareTupleQuery(""
                            +"prefix skos: <http://www.w3.org/2004/02/skos/core#>\n"
                            +"\n"
                            +"select ?concept {\n"
                            +"\n"
                            +"\t?concept skos:inScheme $scheme; skos:prefLabel $label. \n"
                            +"\n"
                            +"\tfilter (lcase(str(?label)) = lcase(str($value)))\n"
                            +"\n"
                            +"}\n"
                    );

                    query.setBinding("scheme", Units.Name);
                    query.setBinding("value", literal(key));

                    return query.evaluate().stream().findFirst()
                            .map(bindings -> bindings.getValue("concept"))
                            .orElse(RDF.NIL);

                })))

                .filter(not(RDF.NIL::equals));
    }


    private Optional<Frame> head(final CSVRecord record) {
        return Optional.ofNullable(record.get("Head"))

                .map(HeadPattern::matcher)
                .filter(Matcher::matches)
                .map(matcher -> {

                    final String familyName=matcher.group(1);
                    final String givenName=matcher.group(2);
                    final String fullName=format("%s %s", givenName, familyName);

                    return frame(EC2U.id(EC2U.persons, Poitiers.University, fullName))

                            .value(RDF.TYPE, EC2U.Person)

                            .value(RDFS.LABEL, literal(fullName, Poitiers.Language))

                            .value(EC2U.university, Poitiers.University)

                            .value(FOAF.GIVEN_NAME, literal(givenName))
                            .value(FOAF.FAMILY_NAME, literal(familyName));

                });
    }

}
