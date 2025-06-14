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

import com.metreeca.flow.http.actions.GET;
import com.metreeca.flow.services.Logger;
import com.metreeca.flow.xml.XPath;
import com.metreeca.flow.xml.formats.HTML;
import com.metreeca.shim.URIs;

import eu.ec2u.data.datasets.organizations.OrganizationFrame;
import eu.ec2u.work.PageKeeper;

import java.net.URI;
import java.util.Optional;
import java.util.stream.Stream;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.services.Logger.logger;
import static com.metreeca.shim.Collections.map;
import static com.metreeca.shim.Lambdas.lenient;
import static com.metreeca.shim.Loggers.time;
import static com.metreeca.shim.Streams.optional;
import static com.metreeca.shim.Streams.traverse;
import static com.metreeca.shim.URIs.uri;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.datasets.Localized.EN;
import static eu.ec2u.data.datasets.universities.University.TURKU;
import static java.lang.String.format;
import static java.util.Map.entry;
import static java.util.stream.Collectors.collectingAndThen;
import static java.util.stream.Collectors.toSet;

public final class EventsTurkuUniversity implements Runnable {

    private static final URI PIPELINE=uri("java:%s".formatted(EventsTurkuUniversity.class.getName()));

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

    private final Logger logger=service(logger());


    @Override
    public void run() {
        time(() -> Stream

                .of(PUBLISHER.id().toString())

                .flatMap(traverse(

                        url -> Stream.of(url)
                                .flatMap(optional(new GET<>(new HTML())))
                                .map(XPath::new),

                        path -> path.links("//nav[@class='pager']//li[contains(@class,'pager__item')]//a/@href"),
                        path -> path.links("//h3[@class='event__title']/a/@href")

                ))

                .flatMap(optional(lenient(URIs::uri)))

                .collect(collectingAndThen(toSet(), new PageKeeper<>(
                        PIPELINE,
                        page -> new Events.Scanner().apply(page, new EventFrame().university(TURKU).publisher(PUBLISHER)),
                        page -> Optional.of(new EventFrame(true).id(page.resource()))
                )))

        ).apply((elapsed, resources) -> logger.info(this, format(
                "synced <%,d> resources in <%,d> ms", resources, elapsed
        )));
    }


}
