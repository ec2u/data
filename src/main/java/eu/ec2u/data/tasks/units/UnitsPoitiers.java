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

import com.metreeca.core.services.Vault;
import com.metreeca.link.Values;

import eu.ec2u.data.cities.Poitiers;

import static com.metreeca.core.Locator.service;
import static com.metreeca.core.services.Vault.vault;

import static eu.ec2u.data.tasks.Tasks.exec;

import static java.lang.String.format;

public final class UnitsPoitiers implements Runnable {

    private static final String DataUrl="units-poitiers-url"; // vault label


    public static void main(final String... args) {
        exec(() -> new UnitsPoitiers().run());
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final Vault vault=service(vault());


    @Override public void run() {

        final String url=vault
                .get(DataUrl)
                .orElseThrow(() -> new IllegalStateException(format(
                        "undefined data URL <%s>", DataUrl
                )));

        new Units_.CSVLoader(Poitiers.University, Poitiers.Language)

                .load(url)

                .forEach(frame -> System.out.println(Values.format(frame)));

        //.sink(units -> upload(EC2U.units,
        //        validate(Unit(), Set.of(EC2U.Unit), units),
        //        () -> clear(Poitiers.University)
        //));
    }

}
