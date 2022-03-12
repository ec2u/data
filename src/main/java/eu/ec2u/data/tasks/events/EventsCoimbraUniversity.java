/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

package eu.ec2u.data.tasks.events;

import com.metreeca.json.Frame;
import com.metreeca.rest.Xtream;
import com.metreeca.rest.actions.Validate;

import eu.ec2u.data.ports.Universities;
import eu.ec2u.data.terms.EC2U;
import eu.ec2u.data.work.Tribe;
import org.eclipse.rdf4j.model.vocabulary.*;

import java.time.ZonedDateTime;

import static com.metreeca.json.Frame.frame;
import static com.metreeca.json.Values.iri;
import static com.metreeca.json.Values.literal;

import static eu.ec2u.data.ports.Events.Event;
import static eu.ec2u.data.tasks.Tasks.exec;
import static eu.ec2u.data.tasks.Tasks.upload;
import static eu.ec2u.data.tasks.events.Events.synced;
import static eu.ec2u.data.tasks.events.EventsCoimbra.*;
import static eu.ec2u.data.work.Work.localize;

import static java.time.ZoneOffset.UTC;

public final class EventsCoimbraUniversity implements Runnable {

    private static final Frame Publisher=frame(iri("https://agenda.uc.pt/"))
            .value(RDF.TYPE, EC2U.Publisher)
            .value(DCTERMS.COVERAGE, EC2U.University)
            .values(RDFS.LABEL,
                    localize("Agenda UC", "en"),
                    localize("Agenda UC", Portuguese)
            );


    public static void main(final String... args) {
        exec(() -> new EventsCoimbraUniversity().run());
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    @Override public void run() {

        final ZonedDateTime now=ZonedDateTime.now(UTC);

        Xtream.of(synced(Publisher.focus()))

                .flatMap(new Tribe()
                        .country(Coimbra)
                        .locality(Portugal)
                        .language(Portuguese)
                )

                .map(event -> event

                        .value(EC2U.university, Universities.Coimbra)
                        .value(EC2U.updated, literal(now))

                        .frame(DCTERMS.PUBLISHER, Publisher)
                )

                .optMap(new Validate(Event()))

                .sink(events -> upload(EC2U.events, events));
    }

}
