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

package eu.ec2u.data.units;

import com.metreeca.http.jsonld.actions.Validate;
import com.metreeca.http.rdf4j.actions.Upload;
import com.metreeca.http.services.Vault;
import com.metreeca.http.work.Xtream;
import com.metreeca.link.Frame;

import eu.ec2u.data.datasets.Datasets;
import org.eclipse.rdf4j.model.IRI;

import static com.metreeca.http.Locator.service;
import static com.metreeca.http.rdf.Values.iri;
import static com.metreeca.http.rdf4j.services.Graph.graph;
import static com.metreeca.http.services.Vault.vault;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.units.Units.Unit;
import static eu.ec2u.data.universities._Universities.Coimbra;
import static java.lang.String.format;

public final class UnitsCoimbra implements Runnable {

    private static final IRI Context=iri(Units.Context, "/coimbra");

    private static final String DataUrl="units-coimbra-url"; // vault label


    public static void main(final String... args) {
        exec(() -> new UnitsCoimbra().run());
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final Vault vault=service(vault());


    @Override public void run() {

        final String url=vault
                .get(DataUrl)
                .orElseThrow(() -> new IllegalStateException(format(
                        "undefined data URL <%s>", DataUrl
                )));

        service(graph()).update(connection -> {

            Xtream.of(url)

                    .flatMap(new Units_.CSVLoader(Coimbra))

                    .optMap(new Validate(Unit()))

                    .flatMap(Frame::stream)
                    .batch(0)

                    .forEach(new Upload()
                            .contexts(Context)
                            .clear(true)
                    );

            Datasets.update(Units.class, Units.Context);
            Datasets.update();

            return null;

        });

    }

}
