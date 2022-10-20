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

import com.metreeca.csv.codecs.CSV;
import com.metreeca.http.Xtream;
import com.metreeca.http.actions.GET;
import com.metreeca.http.services.Vault;
import com.metreeca.json.JSONPath;
import com.metreeca.link.Frame;
import com.metreeca.rdf4j.actions.Update;

import eu.ec2u.data.cities.Poitiers;
import eu.ec2u.data.terms.EC2U;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVRecord;
import org.eclipse.rdf4j.model.IRI;
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
import static com.metreeca.link.Values.iri;
import static com.metreeca.link.Values.literal;
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
            .setDelimiter(',')
            .setQuote('"')
            .build();


    private static final String DataUrl="units-poitiers-url"; // vault label

    private static final IRI SectorScheme=iri(EC2U.concepts, "units-poitier-sector/");


    private static final Pattern HeadPattern=Pattern.compile("\\s*(.*)\\s*,\\s*(.*)\\s*");


    public static void main(final String... args) {
        exec(() -> new UnitsPoitiers().run());
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
        return Optional.ofNullable(record.get("Référence")).map(id -> {

            final Optional<String> acronym=Optional.ofNullable(record.get("Nom"))
                    .filter(not(String::isEmpty));

            final Optional<String> description=Optional.ofNullable(record.get("Description"))
                    .filter(not(String::isEmpty));

            final Optional<String> label=acronym
                    .map(a -> description.map(d -> String.format("%s - %s", a, d)).orElse(a))
                    .or(() -> description);

            return frame(iri(EC2U.units, md5(Poitiers.University+"@"+id)))

                    .values(RDF.TYPE, EC2U.Unit)
                    .value(EC2U.university, Poitiers.University)

                    .value(DCTERMS.TITLE, label.map(v -> literal(v, Poitiers.Language)))

                    .frame(DCTERMS.SUBJECT, Optional.ofNullable(record.get("Secteur"))
                            .filter(not(String::isEmpty))
                            .map(v -> frame(iri(SectorScheme, md5(v)))
                                    .value(RDF.TYPE, SKOS.CONCEPT)
                                    .value(SKOS.PREF_LABEL, literal(v, Poitiers.Language))
                            )
                    )

                    .value(SKOS.PREF_LABEL, label.map(v -> literal(v, Poitiers.Language)))
                    .value(SKOS.ALT_LABEL, acronym.map(v -> literal(v, Poitiers.Language)))

                    //.value(ORG.CLASSIFICATION, Units.GroupRecognized)
                    //.frame(inverse(ORG.HEAD_OF), head(record))

                    .frame(ORG.UNIT_OF, frame(Poitiers.University));

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

                    return frame(iri(EC2U.persons, md5(Poitiers.University+"@"+fullName)))

                            .value(RDF.TYPE, EC2U.Person)

                            .value(RDFS.LABEL, literal(fullName, Poitiers.Language))

                            .value(EC2U.university, Poitiers.University)

                            .value(FOAF.GIVEN_NAME, literal(givenName))
                            .value(FOAF.FAMILY_NAME, literal(familyName));

                });
    }

}
