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

import com.metreeca.flow.actions.GET;
import com.metreeca.flow.csv.formats.CSV;
import com.metreeca.flow.rdf4j.actions.Upload;
import com.metreeca.flow.work.Xtream;

import eu.ec2u.work._junk.Frame;
import org.apache.commons.csv.CSVFormat;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.vocabulary.ORG;

import java.util.Collection;
import java.util.Locale;
import java.util.stream.Stream;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.rdf.Values.iri;
import static com.metreeca.flow.services.Vault.vault;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.work._junk.Frame.field;
import static eu.ec2u.work._junk.Frame.frame;
import static org.eclipse.rdf4j.model.vocabulary.RDF.TYPE;
import static org.eclipse.rdf4j.model.vocabulary.XSD.ID;

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


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    @Override public void run() {
        Xtream

                .from(associations())

                .flatMap(Frame::stream)
                .batch(0)

                .forEach(new Upload()
                        .contexts(Context)
                        .clear(true)
                );
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Stream<Frame> associations() {

        final String url=service(vault()).get(DataUrl);


        return Xtream.of(url)

                .optMap(new GET<>(new CSV(Format)))

                .flatMap(Collection::stream)

                .filter(record -> !record.get("Unit").isEmpty())

                .map(record -> {

                    final IRI vi=iri(Units.Context, "/"+record.get("VI").toLowerCase(Locale.ROOT));
                    final IRI unit=iri(record.get("Unit"));

                    return frame(

                            field(ID, unit),
                            field(TYPE, ORG.ORGANIZATIONAL_UNIT),

                            field(ORG.UNIT_OF, vi)

                    );

                });

    }

}
