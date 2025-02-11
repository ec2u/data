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
import static com.metreeca.shim.URIs.uri;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.datasets.Localized.EN;
import static eu.ec2u.data.datasets.universities.University.TURKU;
import static java.util.Map.entry;

public final class EventsTurkuUniversity implements Runnable {

    private static final OrganizationFrame PUBLISHER=new OrganizationFrame()

            .id(uri("https://www.utu.fi/event-search/"))
            .university(TURKU)

            .prefLabel(map(
                    entry(EN, "University of Turku / News"),
                    entry(TURKU.locale(), "Turun yliopisto / Ajankohtaista")
            ));


    public static void main(final String... args) {
        exec(() -> new EventsTurkuUniversity().run());
    }


    //̸////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final Store store=service(store());


    @Override
    public void run() {
        store.insert(array(Xtream

                .of(PUBLISHER.id().toString())

                .flatMap(home -> Xtream.of(home).crawl(url -> Xtream.of(url)

                        .optMap(new GET<>(new HTML()))
                        .map(XPath::new)

                        .map(path -> entry(
                                path.links("//nav[@class='pager']//li[contains(@class,'pager__item')]//a/@href"),
                                path.links("//h3[@class='event__title']/a/@href")
                        ))

                ))

                .pipe(new Events.Scanner(TURKU, PUBLISHER))));
    }

}
