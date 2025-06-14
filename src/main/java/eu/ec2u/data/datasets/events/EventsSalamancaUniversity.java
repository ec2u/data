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
import com.metreeca.flow.ical.formats.iCal;
import com.metreeca.flow.services.Logger;
import com.metreeca.shim.URIs;

import eu.ec2u.data.datasets.organizations.OrganizationFrame;
import eu.ec2u.work.PageKeeper;
import net.fortuna.ical4j.model.component.VEvent;
import net.fortuna.ical4j.model.property.Description;

import java.net.URI;
import java.util.Optional;
import java.util.stream.Stream;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.http.Message.ABSOLUTE_PATTERN;
import static com.metreeca.flow.services.Logger.logger;
import static com.metreeca.shim.Collections.map;
import static com.metreeca.shim.Lambdas.lenient;
import static com.metreeca.shim.Loggers.time;
import static com.metreeca.shim.Streams.optional;
import static com.metreeca.shim.URIs.uri;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.datasets.Localized.EN;
import static eu.ec2u.data.datasets.universities.University.SALAMANCA;
import static java.lang.String.format;
import static java.util.Map.entry;
import static java.util.stream.Collectors.collectingAndThen;
import static java.util.stream.Collectors.toSet;
import static net.fortuna.ical4j.model.Component.VEVENT;

public final class EventsSalamancaUniversity implements Runnable {

    private static final URI PIPELINE=uri("java:%s".formatted(EventsSalamancaUniversity.class.getName()));

    private static final OrganizationFrame PUBLISHER=new OrganizationFrame()

            .id(uri("https://eventum.usal.es/"))
            .university(SALAMANCA)

            .prefLabel(map(
                    entry(EN, "University of Salamanca / Eventum"),
                    entry(SALAMANCA.locale(), "Universidad de Salamanca / Eventum")
            ));


    public static void main(final String... args) {
        exec(() -> new EventsSalamancaUniversity().run());
    }


    //̸////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final Logger logger=service(logger());


    @Override
    public void run() {
        time(() -> Stream

                .of("https://eventum.usal.es/ics/location/spain/lo-1.ics") // https://eventum.usal.es/kml.html

                .flatMap(optional(new GET<>(new iCal())))

                .flatMap(calendar -> calendar.getComponents(VEVENT).stream().map(VEvent.class::cast))

                .flatMap(optional(v -> v.getDescription()
                        .map(Description::getValue)
                        .filter(ABSOLUTE_PATTERN.asMatchPredicate())
                ))

                .flatMap(optional(lenient(URIs::uri)))

                .collect(collectingAndThen(toSet(), new PageKeeper<>(
                        PIPELINE,
                        page -> new Events.Scanner().apply(page, new EventFrame().university(SALAMANCA).publisher(PUBLISHER)),
                        page -> Optional.of(new EventFrame(true).id(page.resource()))
                )))

        ).apply((elapsed, resources) -> logger.info(this, format(
                "synced <%,d> resources in <%,d> ms", resources, elapsed
        )));
    }
}
