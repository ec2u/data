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

package eu.ec2u.data.units;

import com.metreeca.http.actions.GET;
import com.metreeca.http.csv.formats.CSV;
import com.metreeca.http.rdf4j.actions.Upload;
import com.metreeca.http.work.Xtream;

import org.apache.commons.csv.CSVFormat;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.model.vocabulary.ORG;

import java.util.Collection;
import java.util.List;
import java.util.Locale;
import java.util.stream.Stream;

import static com.metreeca.http.Locator.service;
import static com.metreeca.http.rdf.Values.iri;
import static com.metreeca.http.rdf.Values.statement;
import static com.metreeca.http.services.Vault.vault;

import static eu.ec2u.data.Data.exec;
import static java.lang.String.format;
import static java.util.stream.Collectors.toList;

public final class UnitsSalamancaVIs implements Runnable {

    private static final IRI Context=iri(Units.Context, "/salamanca/vis");

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
        Stream

                .of(associations())

                .forEach(new Upload()
                        .contexts(Context)
                        .clear(true)
                );
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

                    final IRI vi=iri(Units.Context, "/"+record.get("VI").toLowerCase(Locale.ROOT));
                    final IRI unit=iri(record.get("Unit"));

                    return statement(unit, ORG.UNIT_OF, vi);

                })

                .collect(toList());

    }

}
