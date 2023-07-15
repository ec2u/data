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

import com.metreeca.http.actions.Fill;
import com.metreeca.http.actions.GET;
import com.metreeca.http.rdf.Frame;
import com.metreeca.http.work.Xtream;
import com.metreeca.http.xml.formats.XML;

import eu.ec2u.data.Data;
import eu.ec2u.data.resources.Resources;
import eu.ec2u.data.universities.Universities;
import eu.ec2u.work.feeds.RSS;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.vocabulary.DCTERMS;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.eclipse.rdf4j.model.vocabulary.RDFS;

import java.time.Instant;
import java.time.ZonedDateTime;

import static com.metreeca.http.rdf.Frame.frame;
import static com.metreeca.http.rdf.Values.iri;
import static com.metreeca.http.rdf.Values.literal;

import static eu.ec2u.data.EC2U.University.Iasi;
import static eu.ec2u.work.feeds.WordPress.WordPress;
import static java.time.ZoneOffset.UTC;

public final class EventsIasiUniversity360 implements Runnable {

    private static final IRI Context=iri(Events.Context, "/iasi/university-360");

    private static final Frame Publisher=frame(iri("https://360.uaic.ro/blog/category/evenimente/"))
            .value(RDF.TYPE, Resources.Publisher)
            .value(DCTERMS.COVERAGE, Universities.University)
            .values(RDFS.LABEL,
                    literal("University of Iasi / 360 Events", "en"),
                    literal("Universitatea din Iași / 360 Evenimente", Iasi.Language)
            );


    public static void main(final String... args) {
        Data.exec(() -> new EventsIasiUniversity360().run());
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final ZonedDateTime now=ZonedDateTime.now(UTC);


    @Override public void run() {
        // Xtream.of(synced(Context, Publisher.focus()))
        //
        //         .flatMap(this::crawl)
        //         .map(this::event)
        //
        //         .pipe(events -> validate(Event(), Set.of(Event), events))
        //
        //         .forEach(new Events.Updater(Context));
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Xtream<Frame> crawl(final Instant synced) {
        return Xtream.of(synced)

                .flatMap(new Fill<Instant>()
                        .model("https://360.uaic.ro/feed")
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
