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

package eu.ec2u.data.services;

import com.metreeca.flow.http.handlers.Delegator;
import com.metreeca.flow.http.handlers.Router;
import com.metreeca.flow.http.handlers.Worker;
import com.metreeca.flow.services.Logger;
import com.metreeca.mesh.meta.jsonld.Frame;
import com.metreeca.mesh.meta.jsonld.Virtual;

import eu.ec2u.data.datasets.documents.*;
import eu.ec2u.data.datasets.events.*;
import eu.ec2u.data.datasets.offerings.*;
import eu.ec2u.data.datasets.units.*;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.gcp.GCPServer.cron;
import static com.metreeca.flow.http.Response.BadGateway;
import static com.metreeca.flow.http.Response.OK;
import static com.metreeca.flow.services.Logger.logger;
import static com.metreeca.shim.Loggers.time;

import static java.lang.String.format;

@Frame
@Virtual
public interface Pipelines {

    @SuppressWarnings("OverlyCoupledClass")
    final class Handler extends Delegator {

        private final Logger logger=service(logger());


        public Handler() {
            delegate(cron(new Router()

                    .path("/units/coimbra", execute(new UnitsCoimbra()))
                    .path("/units/iasi", execute(new UnitsIasi()))
                    .path("/units/jena", execute(new UnitsJena()))
                    .path("/units/linz", execute(new UnitsLinz()))
                    .path("/units/pavia", execute(new UnitsPavia()))
                    .path("/units/poitiers", execute(new UnitsPoitiers()))
                    .path("/units/salamanca", execute(new UnitsSalamanca()))
                    .path("/units/turku", execute(new UnitsTurku()))

                    .path("/offerings/coimbra", execute(new OfferingsCoimbra()))
                    .path("/offerings/jena", execute(new OfferingsJena()))
                    .path("/offerings/linz", execute(new OfferingsLinz()))
                    .path("/offerings/pavia", execute(new OfferingsPavia()))
                    .path("/offerings/pavia/doctorates", execute(new OfferingsPaviaDoctorates()))
                    .path("/offerings/pavia/schools", execute(new OfferingsPaviaSchools()))
                    .path("/offerings/poitiers", execute(new OfferingsPoitiers()))
                    .path("/offerings/salamanca", execute(new OfferingsSalamanca()))
                    .path("/offerings/lll", execute(new OfferingsLLL()))

                    .path("/documents/coimbra", execute(new DocumentsCoimbra()))
                    .path("/documents/iasi", execute(new DocumentsIasi()))
                    .path("/documents/jena", execute(new DocumentsJena()))
                    .path("/documents/linz", execute(new DocumentsLinz()))
                    .path("/documents/pavia", execute(new DocumentsPavia()))
                    .path("/documents/poitiers", execute(new DocumentsPoitiers()))
                    .path("/documents/salamanca", execute(new DocumentsSalamanca()))
                    .path("/documents/turku", execute(new DocumentsTurku()))
                    .path("/documents/umea", execute(new DocumentsUmea()))

                    .path("/events", execute(new Events.Reaper()))
                    .path("/events/coimbra/university", execute(new EventsCoimbraUniversity()))
                    .path("/events/iasi/university/360", execute(new EventsIasiUniversity360()))
                    .path("/events/jena/university", execute(new EventsJenaUniversity()))
                    .path("/events/linz/university", execute(new EventsLinzUniversity()))
                    .path("/events/pavia/university", execute(new EventsPaviaUniversity()))
                    .path("/events/poitiers/university", execute(new EventsPoitiersUniversity()))
                    .path("/events/salamanca/university", execute(new EventsSalamancaUniversity()))
                    .path("/events/turku/university", execute(new EventsTurkuUniversity()))
                    .path("/events/umea/university", execute(new EventsUmeaUniversity()))

            ));
        }


        private com.metreeca.flow.http.Handler execute(final Runnable task) {
            return new Worker()

                    .get((request, forward) -> {

                        try {

                            time(task).apply(t -> logger.info(task.getClass(), format(
                                    "executed in <%,d> ms", t
                            )));

                            return request.reply(OK);

                        } catch ( final RuntimeException e ) {

                            service(logger()).warning(task.getClass(), "failed", e);

                            return request.reply(BadGateway, format(
                                    "task failed / %s", e.getMessage()
                            ));

                        }

                    });
        }

    }

}
