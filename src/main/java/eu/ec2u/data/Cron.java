/*
 * Copyright © 2020-2024 EC2U Alliance
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

package eu.ec2u.data;

import com.metreeca.http.Handler;
import com.metreeca.http.handlers.Delegator;
import com.metreeca.http.handlers.Router;
import com.metreeca.http.handlers.Worker;
import com.metreeca.http.services.Logger;

import eu.ec2u.data.documents.*;
import eu.ec2u.data.events.*;
import eu.ec2u.data.offerings.*;
import eu.ec2u.data.units.*;
import eu.ec2u.data.universities.Universities_;

import static com.metreeca.http.Locator.service;
import static com.metreeca.http.Response.BadGateway;
import static com.metreeca.http.Response.OK;
import static com.metreeca.http.gcp.GCPServer.cron;
import static com.metreeca.http.services.Logger.logger;
import static com.metreeca.http.services.Logger.time;

import static java.lang.String.format;


@SuppressWarnings("OverlyCoupledClass")
public final class Cron extends Delegator {

    private final Logger logger=service(logger());


    public Cron() {
        delegate(cron(new Router()

                .path("/universities/", execute(new Universities_()))

                .path("/units/coimbra", execute(new UnitsCoimbra()))
                .path("/units/iasi", execute(new UnitsIasi()))
                .path("/units/jena", execute(new UnitsJena()))
                .path("/units/pavia", execute(new UnitsPavia()))
                .path("/units/poitiers", execute(new UnitsPoitiers()))
                .path("/units/salamanca", execute(new UnitsSalamanca()))
                .path("/units/turku", execute(new UnitsTurku()))

                .path("/offerings/coimbra", execute(new OfferingsCoimbra()))
                .path("/offerings/jena", execute(new OfferingsJena()))
                .path("/offerings/pavia", execute(new OfferingsPavia()))
                .path("/offerings/poitiers", execute(new OfferingsPoitiers()))
                .path("/offerings/salamanca", execute(new OfferingsSalamanca()))

                .path("/documents/coimbra", execute(new DocumentsCoimbra()))
                .path("/documents/iasi", execute(new DocumentsIasi()))
                .path("/documents/jena", execute(new DocumentsJena()))
                .path("/documents/pavia", execute(new DocumentsPavia()))
                .path("/documents/poitiers", execute(new DocumentsPoitiers()))
                .path("/documents/salamanca", execute(new DocumentsSalamanca()))
                .path("/documents/turku", execute(new DocumentsTurku()))

                .path("/events/coimbra/university", execute(new EventsCoimbraUniversity()))
                .path("/events/coimbra/city", execute(new EventsCoimbraCity()))
                .path("/events/iasi/university", execute(new EventsIasiUniversity()))
                .path("/events/iasi/university/360", execute(new EventsIasiUniversity360()))
                .path("/events/iasi/city/cultura", execute(new EventsIasiCityCultura()))
                .path("/events/iasi/city/in-oras", execute(new EventsIasiCityInOras()))
                .path("/events/jena/university", execute(new EventsJenaUniversity()))
                .path("/events/jena/city", execute(new EventsJenaCity()))
                .path("/events/pavia/borromeo", execute(new EventsPaviaBorromeo()))
                .path("/events/poitiers/university", execute(new EventsPoitiersUniversity()))
                .path("/events/poitiers/city/grand", execute(new EventsPoitiersCityGrand()))
                .path("/events/salamanca/university", execute(new EventsSalamancaUniversity()))
                .path("/events/salamanca/city/sacis", execute(new EventsSalamancaCitySACIS()))
                .path("/events/salamanca/city/to", execute(new EventsSalamancaCityTO()))
                .path("/events/turku/university", execute(new EventsTurkuUniversity()))
                .path("/events/turku/city", execute(new EventsTurkuCity()))

        ));
    }


    private Handler execute(final Runnable task) {
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
