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

package eu.ec2u.data._tasks.units;

import com.metreeca.core.Xtream;
import com.metreeca.csv.codecs.CSV;
import com.metreeca.http.actions.GET;

import eu.ec2u.data.ontologies.EC2U;
import org.apache.commons.csv.CSVFormat;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.model.vocabulary.ORG;
import org.eclipse.rdf4j.query.QueryLanguage;

import java.util.*;

import static com.metreeca.core.Locator.service;
import static com.metreeca.core.services.Vault.vault;
import static com.metreeca.link.Values.iri;
import static com.metreeca.link.Values.statement;
import static com.metreeca.rdf4j.services.Graph.graph;

import static eu.ec2u.data.Data.exec;

import static java.lang.String.format;
import static java.util.stream.Collectors.toList;

public final class UnitsSalamancaVIs implements Runnable {

    private static final String DataUrl="units-salamanca-vis-url";

    private static final CSVFormat Format=CSVFormat.Builder.create()
            .setHeader()
            .setSkipHeaderRecord(true)
            .setIgnoreHeaderCase(true)
            .build();


    public static void main(final String... args) {
        exec(() -> new UnitsSalamancaVIs().run());
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    @Override public void run() {

        final List<Statement> associations=associations();

        service(graph()).update(connection -> {

            connection

                    .prepareUpdate(QueryLanguage.SPARQL,

                            "prefix ec2u: </terms/>\n"
                                    +"prefix org: <http://www.w3.org/ns/org#>\n"
                                    +"\n"
                                    +"delete {\n"
                                    +"\n"
                                    +"\t?u org:unitOf ?i\n"
                                    +"\n"
                                    +"} where {\n"
                                    +"\n"
                                    +"?u a ec2u:Unit ;\n"
                                    +"\t\tec2u:university </universities/salamanca> ;\n"
                                    +"\t"
                                    +"\t\torg:unitOf ?i .\n"
                                    +"\n"
                                    +"\t?i org:classification </concepts/units/institute-virtual> .\n"
                                    +"\n"
                                    +"}",

                            EC2U.Base
                    )

                    .execute();

            connection.add(associations, EC2U.units);

            return this;

        });

    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private List<Statement> associations() {

        final String url=service(vault())
                .get(DataUrl)
                .orElseThrow(() -> new IllegalStateException(format(
                        "undefined data URL <%s>", DataUrl
                )));


        return Xtream.of(url)

                .optMap(new GET<>(new CSV(Format)))

                .flatMap(Collection::stream)

                .filter(record -> !record.get("Unit").isEmpty())

                .map(record -> {

                    final IRI vi=iri(EC2U.units, record.get("VI").toLowerCase(Locale.ROOT));
                    final IRI unit=iri(record.get("Unit"));

                    return statement(unit, ORG.UNIT_OF, vi);

                })

                .collect(toList());

    }

}
