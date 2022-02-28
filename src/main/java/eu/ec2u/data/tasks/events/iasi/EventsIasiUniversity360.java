/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

package eu.ec2u.data.tasks.events.iasi;

import com.metreeca.json.Frame;
import com.metreeca.rest.Xtream;
import com.metreeca.rest.actions.*;

import eu.ec2u.data.ports.Universities;
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
import static eu.ec2u.data.work.Work.wordpress;

import static java.time.ZoneOffset.UTC;

public final class EventsIasiUniversity360 implements Runnable {

    private static final Frame Publisher=frame(iri("https://360.uaic.ro/"))
            .value(RDF.TYPE, EC2U.Publisher)
            .value(DCTERMS.COVERAGE, EC2U.University)
            .values(RDFS.LABEL,
                    literal("360 uaic.ro", "en")
            );


    public static void main(final String... args) {
        exec(() -> new EventsIasiUniversity360().run());
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
                        .model("https://360.uaic.ro/feed")
                )

                .optMap(new GET<>(xml()))

                .flatMap(new RSS());
    }

    private Frame event(final Frame frame) {
        return wordpress(frame, "ro")
                .frame(DCTERMS.PUBLISHER, Publisher)
                .value(EC2U.university, Universities.Iasi)
                .value(EC2U.updated, literal(now));
    }

}
