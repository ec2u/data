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

import com.metreeca.http.services.Vault;

import eu.ec2u.data.Data;
import org.eclipse.rdf4j.model.IRI;

import static com.metreeca.http.Locator.service;
import static com.metreeca.http.rdf.Values.iri;
import static com.metreeca.http.services.Vault.vault;

public final class UnitsPoitiers implements Runnable {

    private static final IRI Context=iri(Units.Context, "/poitiers");

    private static final String DataUrl="units-poitiers-url"; // vault label


    public static void main(final String... args) {
        Data.exec(() -> new UnitsPoitiers().run());
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final Vault vault=service(vault());


    @Override public void run() {
        //
        // final String url=vault
        //         .get(DataUrl)
        //         .orElseThrow(() -> new IllegalStateException(format(
        //                 "undefined data URL <%s>", DataUrl
        //         )));
        //
        // Xtream.of(url)
        //
        //         .flatMap(new Units.CSVLoader(Poitiers))
        //
        //         .pipe(units -> validate(Unit(), Set.of(Unit), units))
        //
        //         .forEach(new Upload()
        //                 .contexts(Context)
        //                 .clear(true)
        //         );
    }

}
