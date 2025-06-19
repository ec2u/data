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
import static eu.ec2u.data.datasets.universities.University.LINZ;
import static java.lang.String.format;
import static java.util.Map.entry;
import static java.util.stream.Collectors.collectingAndThen;
import static java.util.stream.Collectors.toSet;

public final class EventsLinzUniversity implements Runnable {

    private static final URI PIPELINE=uri("java:%s".formatted(EventsLinzUniversity.class.getName()));

    private static final OrganizationFrame PUBLISHER=new OrganizationFrame()

            .id(uri("https://www.jku.at/news-events/events/"))
            .university(LINZ)

            .prefLabel(map(
                    entry(EN, "University of Linz / News & Events"),
                    entry(LINZ.locale(), "Universität Linz / Nachrichten & Veranstaltungen")
            ));


    public static void main(final String... args) {
        exec(() -> new EventsLinzUniversity().run());
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

                        path -> path.links("//*[contains(@class,'f3-widget-paginator')]/li/a/@href"),
                        path -> path.links("//*[contains(@class,'news_list_item')]/a/@href")

                ))

                .flatMap(optional(lenient(URIs::uri)))

                .collect(collectingAndThen(toSet(), new PageKeeper<EventFrame>(PIPELINE)
                        .insert(page -> new Events.Scanner().apply(page, new EventFrame().university(LINZ).publisher(PUBLISHER)))
                        .remove(page -> Optional.of(new EventFrame(true).id(page.resource())))
                        .annexes(PUBLISHER)
                ))

        ).apply((elapsed, resources) -> logger.info(this, format(
                "synced <%,d> resources in <%,d> ms", resources, elapsed
        )));
    }

}
