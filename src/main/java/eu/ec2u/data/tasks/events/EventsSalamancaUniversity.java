/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

package eu.ec2u.data.tasks.events;

import com.metreeca.json.Frame;
import com.metreeca.rest.Xtream;
import com.metreeca.rest.actions.*;

import eu.ec2u.data.cities.Salamanca;
import eu.ec2u.data.terms.EC2U;
import eu.ec2u.data.work.RSS;
import org.eclipse.rdf4j.model.vocabulary.*;

import java.time.Instant;
import java.time.ZonedDateTime;

import static com.metreeca.json.Frame.frame;
import static com.metreeca.json.Values.iri;
import static com.metreeca.json.Values.literal;
import static com.metreeca.xml.formats.XMLFormat.xml;

import static eu.ec2u.data.ports.Events.Event;
import static eu.ec2u.data.tasks.Tasks.exec;
import static eu.ec2u.data.tasks.Tasks.upload;
import static eu.ec2u.data.tasks.events.Events.synced;
import static eu.ec2u.data.work.WordPress.RSS;

import static java.time.ZoneOffset.UTC;

public final class EventsSalamancaUniversity implements Runnable {

    private static final Frame Publisher=frame(iri("https://sac.usal.es/"))
            .value(RDF.TYPE, EC2U.Publisher)
            .value(DCTERMS.COVERAGE, EC2U.University)
            .values(RDFS.LABEL,
                    literal("Cultural Activities Services", "en"),
                    literal("Servicio de Actividades Culturales", "es")
            );


    public static void main(final String... args) {
        exec(() -> new EventsSalamancaUniversity().run());
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final ZonedDateTime now=ZonedDateTime.now(UTC);


    @Override public void run() {
        Xtream.of(synced(Publisher.focus()))

                .flatMap(this::crawl)
                .map(this::event)

                .optMap(new Validate(Event()))

                .sink(events -> upload(EC2U.events, events));
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Xtream<Frame> crawl(final Instant synced) {
        return Xtream.of(synced)

                .flatMap(new Fill<Instant>()
                        .model("https://sac.usal.es/role-member/feed/")
                )

                .optMap(new GET<>(xml()))

                .flatMap(new RSS());
    }

    private Frame event(final Frame frame) {
        return RSS(frame, "es")

                .value(EC2U.university, Salamanca.University)
                .value(EC2U.updated, literal(now))

                .frame(DCTERMS.PUBLISHER, Publisher);
    }

}