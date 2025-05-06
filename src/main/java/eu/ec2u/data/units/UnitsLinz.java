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

import com.metreeca.flow.rdf4j.actions.Upload;
import com.metreeca.flow.services.Vault;
import com.metreeca.flow.work.Xtream;
import com.metreeca.link.Frame;

import org.eclipse.rdf4j.model.IRI;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.services.Vault.vault;
import static com.metreeca.link.Frame.iri;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.EC2U.update;
import static eu.ec2u.data.universities.University.Linz;

public final class UnitsLinz implements Runnable {

    private static final IRI Context=iri(Units.Context, "/linz");

    private static final String DataUrl="units-linz-url"; // vault label


    public static void main(final String... args) {
        exec(() -> new UnitsLinz().run());
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final Vault vault=service(vault());

    @Override public void run() {

        final String url=vault.get(DataUrl);

        update(connection -> Xtream.of(url)

                .flatMap(new Units_.CSVLoader(Linz))

                .flatMap(Frame::stream)
                .batch(0)

                .forEach(new Upload()
                        .contexts(Context)
                        .clear(true)
                )

        );

    }


}
