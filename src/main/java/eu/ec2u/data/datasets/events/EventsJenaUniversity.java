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

import java.util.Collection;
import java.util.List;
import java.util.stream.Stream;

import static com.metreeca.flow.Locator.async;
import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.json.formats.JSON.store;
import static com.metreeca.mesh.Value.array;
import static com.metreeca.shim.Collections.list;
import static com.metreeca.shim.Collections.map;
import static com.metreeca.shim.Futures.joining;
import static com.metreeca.shim.Streams.optional;
import static com.metreeca.shim.URIs.uri;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.datasets.Localized.EN;
import static eu.ec2u.data.datasets.universities.University.JENA;
import static java.util.Map.entry;

public final class EventsJenaUniversity implements Runnable {

    private static final List<OrganizationFrame> PUBLISHERS=list(

            new OrganizationFrame()
                    .id(uri("https://www.uni-jena.de/16965/kommende-veranstaltungen"))
                    .university(JENA)
                    .prefLabel(map(
                            entry(EN, "Jena University / Events (German)"),
                            entry(JENA.locale(), "Universität Jena / Veranstaltungen (Deutsch)")
                    )),

            new OrganizationFrame()
                    .id(uri("https://www.uni-jena.de/en/16965/events"))
                    .university(JENA)
                    .prefLabel(map(
                            entry(EN, "Jena University / Events (English)"),
                            entry(JENA.locale(), "Universität Jena / Veranstaltungen (Englisch)")
                    )),

            new OrganizationFrame()
                    .id(uri("https://www.uni-jena.de/17425/veranstaltungskalender"))
                    .university(JENA)
                    .prefLabel(map(
                            entry(EN, "Jena University / International / Events (German)"),
                            entry(JENA.locale(), "Universität Jena / International / Veranstaltungen (Deutsch)")
                    )),

            new OrganizationFrame()
                    .id(uri("https://www.uni-jena.de/en/17425/upcoming-events"))
                    .university(JENA)
                    .prefLabel(map(
                            entry(EN, "Jena University / International / Events (English)"),
                            entry(JENA.locale(), "Universität Jena / International / Veranstaltungen (Englisch)")
                    )),

            new OrganizationFrame()
                    .id(uri("https://www.uni-jena.de/81092/kalender-studium-international"))
                    .university(JENA)
                    .prefLabel(map(
                            entry(EN, "Jena University / Calendar Studies international / Events (German)"),
                            entry(JENA.locale(), "Universität Jena / Kalender Studium international / Veranstaltungen (Deutsch)")
                    )),

            new OrganizationFrame()
                    .id(uri("https://www.uni-jena.de/en/81092/calendar-studium-international"))
                    .university(JENA)
                    .prefLabel(map(
                            entry(EN, "Jena University / Calendar Studies international / Events (English)"),
                            entry(JENA.locale(), "Universität Jena / Kalender Studium international / Veranstaltungen (Englisch)")
                    )),

            new OrganizationFrame()
                    .id(uri("https://www.uni-jena.de/120659/ec2u-veranstaltungen"))
                    .university(JENA)
                    .prefLabel(map(
                            entry(EN, "Jena University / EC2U / Events (German)"),
                            entry(JENA.locale(), "Universität Jena / EC2U / Veranstaltungen (Deutsch)")
                    )),

            new OrganizationFrame()
                    .id(uri("https://www.uni-jena.de/en/120659/ec2u-veranstaltungen"))
                    .university(JENA)
                    .prefLabel(map(
                            entry(EN, "Jena University / EC2U / Events (English)"),
                            entry(JENA.locale(), "Universität Jena / EC2U / Veranstaltungen (Englisch)")
                    )),

            new OrganizationFrame()
                    .id(uri("https://www.uni-jena.de/17210/veranstaltungen"))
                    .university(JENA)
                    .prefLabel(map(
                            entry(EN, "Jena University / Academic Career / Events (German)"),
                            entry(JENA.locale(), "Universität Jena / Wissenschaftliche Karriere/ Veranstaltungen (Deutsch)")
                    )),

            new OrganizationFrame()
                    .id(uri("https://www.uni-jena.de/en/17210/events"))
                    .university(JENA)
                    .prefLabel(map(
                            entry(EN, "Jena University / Academic Career / Events (English)"),
                            entry(JENA.locale(), "Universität Jena / Wissenschaftliche Karriere/ Veranstaltungen (Englisch)")
                    ))
    );


    public static void main(final String... args) {
        exec(() -> new EventsJenaUniversity().run());
    }


    //̸////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final Store store=service(store());


    @Override
    public void run() {
        store.insert(array(PUBLISHERS.stream()

                .map(publisher -> async(() -> Xtream

                        .of(publisher.id().toString())

                        .flatMap(home -> Xtream.of(home).crawl(url -> Stream.of(url)

                                .flatMap(optional(new GET<>(new HTML())))
                                .map(XPath::new)

                                .map(path -> entry(
                                        path.links("//div[@class='pagination']/button[contains(@name, 'page')]/@href"),
                                        path.links("//ol/li[p]/a/@href")
                                ))

                        ))

                        .pipe(new Events.Scanner(JENA, publisher))

                        .toList()

                ))

                .collect(joining())
                .flatMap(Collection::stream)

        ));
    }

}
