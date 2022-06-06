/*
 * Copyright © 2021-2022 EC2U Consortium
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

package eu.ec2u.data.tasks.events;

import com.metreeca.http.Xtream;
import com.metreeca.http.actions.Fill;
import com.metreeca.http.actions.GET;
import com.metreeca.jsonld.actions.Validate;
import com.metreeca.link.Frame;
import com.metreeca.xml.codecs.XML;

import eu.ec2u.data.cities.Iasi;
import eu.ec2u.data.terms.EC2U;
import eu.ec2u.data.work.RSS;
import org.eclipse.rdf4j.model.vocabulary.*;

import java.time.Instant;
import java.time.ZonedDateTime;

import static com.metreeca.link.Frame.frame;
import static com.metreeca.link.Values.iri;
import static com.metreeca.link.Values.literal;

import static eu.ec2u.data.ports.Events.Event;
import static eu.ec2u.data.tasks.Tasks._upload;
import static eu.ec2u.data.tasks.Tasks.exec;
import static eu.ec2u.data.tasks.events.Events.synced;
import static eu.ec2u.data.work.WordPress.WordPress;

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
        exec(() -> new EventsIasiCityInOras().run());
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final ZonedDateTime now=ZonedDateTime.now(UTC);


    @Override public void run() {
        Xtream.of(synced(Publisher.focus()))

                .flatMap(this::crawl)
                .map(this::event)

                .optMap(new Validate(Event()))

                .sink(events -> _upload(EC2U.events, events));
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
