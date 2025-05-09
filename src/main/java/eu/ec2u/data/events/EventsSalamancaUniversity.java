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

package eu.ec2u.data.events;

import com.metreeca.flow.http.actions.GET;
import com.metreeca.flow.ical.formats.iCal;
import com.metreeca.flow.services.Logger;
import com.metreeca.flow.work.Xtream;
import com.metreeca.mesh.tools.Store;

import eu.ec2u.data.organizations.OrganizationFrame;
import eu.ec2u.data.taxonomies.EC2UOrganizations;
import net.fortuna.ical4j.model.component.VEvent;
import net.fortuna.ical4j.model.property.Description;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.json.formats.JSON.store;
import static com.metreeca.flow.services.Logger.logger;
import static com.metreeca.flow.toolkits.Identifiers.AbsoluteIRIPattern;
import static com.metreeca.mesh.Value.array;
import static com.metreeca.mesh.util.Collections.*;
import static com.metreeca.mesh.util.Loggers.time;
import static com.metreeca.mesh.util.URIs.uri;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.resources.Localized.EN;
import static eu.ec2u.data.universities.University.SALAMANCA;
import static java.lang.String.format;
import static java.util.Map.entry;
import static net.fortuna.ical4j.model.Component.VEVENT;

public final class EventsSalamancaUniversity implements Runnable {

    private static final OrganizationFrame PUBLISHER=new OrganizationFrame()

            .id(uri("https://eventum.usal.es/"))
            .university(SALAMANCA)

            .prefLabel(map(
                    entry(EN, "University of Salamanca / Eventum"),
                    entry(SALAMANCA.locale(), "Universidad de Salamanca / Eventum")
            ))

            .about(set(EC2UOrganizations.UNIVERSITY));


    public static void main(final String... args) {
        exec(() -> new EventsSalamancaUniversity().run());
    }


    //̸////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final Store store=service(store());
    private final Logger logger=service(logger());


    @Override public void run() {
        time(() -> store.insert(array(list(Xtream

                .of("https://eventum.usal.es/ics/location/spain/lo-1.ics") // https://eventum.usal.es/kml.html

                .optMap(new GET<>(new iCal()))

                .flatMap(calendar -> calendar.getComponents(VEVENT).stream().map(VEvent.class::cast))

                .optMap(v -> v.getDescription()
                        .map(Description::getValue)
                        .filter(AbsoluteIRIPattern.asMatchPredicate())
                )

                .pipe(new Events.Scanner(SALAMANCA, PUBLISHER))

        )))).apply((elapsed, count) -> logger.info(EventsSalamancaUniversity.class, format(
                "inserted <%,d> resources in <%,d> ms", count, elapsed
        )));
    }

}
