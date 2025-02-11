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

package eu.ec2u.data.datasets.events;

import com.metreeca.flow.Xtream;
import com.metreeca.flow.http.actions.GET;
import com.metreeca.flow.xml.XPath;
import com.metreeca.flow.xml.formats.HTML;
import com.metreeca.mesh.tools.Store;

import eu.ec2u.data.datasets.organizations.OrganizationFrame;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.json.formats.JSON.store;
import static com.metreeca.mesh.Value.array;
import static com.metreeca.shim.Collections.map;
import static com.metreeca.shim.Streams.optional;
import static com.metreeca.shim.URIs.uri;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.datasets.Localized.EN;
import static eu.ec2u.data.datasets.universities.University.TURKU;
import static eu.ec2u.data.datasets.universities.University.UMEA;
import static java.util.Map.entry;

public final class EventsUmeaUniversity implements Runnable {

    private static final OrganizationFrame PUBLISHER=new OrganizationFrame()

            .id(uri("https://www.umu.se/en/events/"))
            .university(UMEA)

            .prefLabel(map(
                    entry(EN, "Umeå University / Events"),
                    entry(TURKU.locale(), "Umeå universitet / Kalender")
            ));


    public static void main(final String... args) {
        exec(() -> new EventsUmeaUniversity().run());
    }


    //̸////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final Store store=service(store());


    @Override
    public void run() {
        store.insert(array(Xtream

                .of(PUBLISHER.id().toString())

                .flatMap(optional(new GET<>(new HTML())))
                .map(XPath::new)

                .flatMap(path -> path.links("//a[@class='eventlink']/@href"))

                .pipe(new Events.Scanner(UMEA, PUBLISHER))

        ));
    }

}
