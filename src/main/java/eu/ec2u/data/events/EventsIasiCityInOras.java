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
import com.metreeca.rdf.Frame;
import com.metreeca.xml.formats.XML;

import eu.ec2u.data.Data;
import eu.ec2u.data.EC2U;
import eu.ec2u.data.resources.Resources;
import eu.ec2u.work.feeds.RSS;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.vocabulary.DCTERMS;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.eclipse.rdf4j.model.vocabulary.RDFS;

import java.time.Instant;
import java.time.ZonedDateTime;
import java.util.Set;

import static com.metreeca.rdf.Frame.frame;
import static com.metreeca.rdf.Values.iri;
import static com.metreeca.rdf.Values.literal;

import static eu.ec2u.data.EC2U.University.Iasi;
import static eu.ec2u.data.events.Events.Event;
import static eu.ec2u.data.events.Events.synced;
import static eu.ec2u.work.feeds.WordPress.WordPress;
import static eu.ec2u.work.validation.Validators.validate;
import static java.time.ZoneOffset.UTC;

public final class EventsIasiCityInOras implements Runnable {

    public static final IRI Context=iri(Events.Context, "/iasi/in-oras");

    private static final Frame Publisher=frame(iri("https://iasi.inoras.ro/evenimente"))
            .value(RDF.TYPE, Resources.Publisher)
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
        Xtream.of(synced(Context, Publisher.focus()))

                .flatMap(this::crawl)
                .map(this::event)

                .pipe(events -> validate(Event(), Set.of(Event), events))

                .forEach(new Events.Updater(Context));
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

                .value(Resources.university, Iasi.Id)

                .frame(DCTERMS.PUBLISHER, Publisher)
                .value(DCTERMS.MODIFIED, frame.value(DCTERMS.MODIFIED).orElseGet(() -> literal(now)));
    }

}
