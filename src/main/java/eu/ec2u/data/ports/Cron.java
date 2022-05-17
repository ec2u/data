/*
 * Copyright © 2020 Metreeca srl. All rights reserved.
 */

package eu.ec2u.data.ports;

import com.metreeca.rest.Handler;
import com.metreeca.rest.services.Logger;

import eu.ec2u.data.tasks.*;
import eu.ec2u.data.tasks.events.Events;
import eu.ec2u.data.tasks.events.*;

import static com.metreeca.gcp.GCPServer.cron;
import static com.metreeca.rest.MessageException.status;
import static com.metreeca.rest.Response.BadGateway;
import static com.metreeca.rest.Response.OK;
import static com.metreeca.rest.Toolbox.service;
import static com.metreeca.rest.handlers.Router.router;
import static com.metreeca.rest.services.Logger.logger;
import static com.metreeca.rest.services.Logger.time;

import static java.lang.String.format;


public final class Cron extends Handler.Base {

    private final Logger logger=service(logger());


    public Cron() {
        delegate(cron(router().get(router()

                .path("/chores", execute(new Chores()))
                .path("/inferences", execute(new Inferences()))

                .path("/wikidata", execute(new Wikidata()))

                .path("/events/", execute(new Events()))

                .path("/events/iasi/university", execute(new EventsIasiUniversity()))
                .path("/events/iasi/university/360", execute(new EventsIasiUniversity360()))
                .path("/events/coimbra/university", execute(new EventsCoimbraUniversity()))
                .path("/events/jena/university", execute(new EventsJenaUniversity()))
                .path("/events/pavia/university", execute(new EventsPaviaUniversity()))
                .path("/events/poitiers/university", execute(new EventsPoitiersUniversity()))
                .path("/events/salamanca/university", execute(new EventsSalamancaUniversity()))
                .path("/events/turku/university", execute(new EventsTurkuUniversity()))

                .path("/events/pavia/city", execute(new EventsPaviaCity()))
                .path("/events/turku/city", execute(new EventsTurkuCity()))

        )));
    }


    private Handler execute(final Runnable task) {
        return request -> {

            try {

                time(task).apply(t -> logger.info(task.getClass(), format(
                        "executed in <%,d> ms", t
                )));

                return request.reply(status(OK));

            } catch ( final RuntimeException e ) {

                service(logger()).warning(task.getClass(), "failed", e);

                return request.reply(status(BadGateway, format(
                        "task failed / %s", e.getMessage()
                )));

            }

        };
    }

}
