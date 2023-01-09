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

import com.metreeca.core.Xtream;
import com.metreeca.core.services.Vault;
import com.metreeca.rdf4j.actions.Upload;

import eu.ec2u.data.Data;
import org.eclipse.rdf4j.model.IRI;

import java.util.Set;

import static com.metreeca.core.Locator.service;
import static com.metreeca.core.services.Vault.vault;
import static com.metreeca.link.Values.iri;

import static eu.ec2u.data.EC2U.University.Iasi;
import static eu.ec2u.data.units.Units.Unit;
import static eu.ec2u.work.validation.Validators.validate;

import static java.lang.String.format;

public final class UnitsIasi implements Runnable {

    private static final IRI Context=iri(Units.Context, "/iasi");

    private static final String DataUrl="units-iasi-url"; // vault label


    public static void main(final String... args) {
        Data.exec(() -> new UnitsIasi().run());
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final Vault vault=service(vault());


    @Override public void run() {

        final String url=vault
                .get(DataUrl)
                .orElseThrow(() -> new IllegalStateException(format(
                        "undefined data URL <%s>", DataUrl
                )));

        Xtream.of(url)

                .flatMap(new Units.CSVLoader(Iasi))

                .pipe(units -> validate(Unit(), Set.of(Unit), units))

                .forEach(new Upload()
                        .contexts(Context)
                        .clear(true)
                );
    }

}
