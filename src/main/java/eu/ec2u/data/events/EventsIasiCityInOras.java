/*
 * Copyright © 2020-2023 EC2U Alliance
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

import com.metreeca.core.Xtream;
import com.metreeca.core.actions.Fill;
import com.metreeca.http.actions.GET;
import com.metreeca.link.Frame;
import com.metreeca.xml.codecs.XML;

import eu.ec2u.data.Data;
import eu.ec2u.data._cities.Iasi;
import eu.ec2u.data._work.RSS;
import eu.ec2u.data.ontologies.EC2U;
import org.eclipse.rdf4j.model.vocabulary.*;

import java.time.Instant;
import java.time.ZonedDateTime;
import java.util.Set;

import static com.metreeca.link.Frame.frame;
import static com.metreeca.link.Values.iri;
import static com.metreeca.link.Values.literal;

import static eu.ec2u.data._tasks.Tasks.upload;
import static eu.ec2u.data._tasks.Tasks.validate;
import static eu.ec2u.data._work.WordPress.WordPress;
import static eu.ec2u.data.events.Events.Event;
import static eu.ec2u.data.events.Events_.synced;

import static java.time.ZoneOffset.UTC;

public final class EventsIasiCityInOras implements Runnable {

    private static final Frame Publisher=frame(iri("https://iasi.inoras.ro/evenimente"))
            .value(RDF.TYPE, EC2U.Publisher)
            .value(DCTERMS.COVERAGE, EC2U.City)
            .values(RDFS.LABEL,
                    literal("InOras / Evenimente in Iași", "ro"),
                    literal("InOras / Events in Iasi", "en")
            );


    public static void main(final String... args) {
        Data.exec(() -> new EventsIasiCityInOras().run());
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final ZonedDateTime now=ZonedDateTime.now(UTC);


    @Override public void run() {
        Xtream.of(synced(Publisher.focus()))

                .flatMap(this::crawl)
                .map(this::event)

                .sink(events -> upload(Events.Context,
                        validate(Event(), Set.of(EC2U.Event), events)
                ));
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Xtream<Frame> crawl(final Instant synced) {
        return Xtream.of(synced)

                .flatMap(new Fill<Instant>()
                        .model("https://iasi.inoras.ro/feed/")
                )

                .optMap(new GET<>(new XML()))

                .flatMap(new RSS());
    }

    private Frame event(final Frame frame) {
        return WordPress(frame, Iasi.Language)

                .value(EC2U.university, Iasi.University)

                .frame(DCTERMS.PUBLISHER, Publisher)
                .value(DCTERMS.MODIFIED, frame.value(DCTERMS.MODIFIED).orElseGet(() -> literal(now)));
    }

}
