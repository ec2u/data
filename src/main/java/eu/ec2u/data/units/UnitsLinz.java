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

import com.metreeca.flow.json.actions.Validate;
import com.metreeca.flow.services.Vault;
import com.metreeca.flow.work.Xtream;

import eu.ec2u.data.units.Units.CSVLoader;
import eu.ec2u.data.universities.University;

import java.net.URI;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.json.formats.JSON.store;
import static com.metreeca.flow.services.Vault.vault;
import static com.metreeca.mesh.Value.array;
import static com.metreeca.mesh.tools.Store.Options.FORCE;
import static com.metreeca.mesh.util.Collections.list;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.units.Units.UNITS;

public final class UnitsLinz implements Runnable {

    private static final URI CONTEXT=UNITS.resolve("linz");

    private static final String DATA_URL="units-linz-url"; // vault label


    public static void main(final String... args) {
        exec(() -> new UnitsLinz().run());
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final Vault vault=service(vault());

    @Override public void run() {

        final String url=vault.get(DATA_URL);

        service(store()).partition(CONTEXT).update(array(list(Xtream.of(url)

                .flatMap(new CSVLoader(University.Linz()))

                .optMap(new Validate<>())

        )), FORCE);
    }


}
