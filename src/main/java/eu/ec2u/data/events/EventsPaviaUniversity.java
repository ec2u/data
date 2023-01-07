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
import eu.ec2u.data.resources.Resources;
import eu.ec2u.data.universities.Universities;
import eu.ec2u.work.feeds.RSS;
import eu.ec2u.work.validation.Validators;
import org.eclipse.rdf4j.model.vocabulary.*;

import java.time.Instant;
import java.time.ZonedDateTime;
import java.util.Set;

import static com.metreeca.link.Frame.frame;
import static com.metreeca.link.Values.iri;
import static com.metreeca.link.Values.literal;

import static eu.ec2u.data.EC2U.University.Pavia;
import static eu.ec2u.data.events.Events.Event;
import static eu.ec2u.data.events._Events.synced;
import static eu.ec2u.data.events._Uploads.upload;
import static eu.ec2u.work.feeds.WordPress.WordPress;

import static java.time.ZoneOffset.UTC;

public final class EventsPaviaUniversity implements Runnable {

    private static final Frame Publisher=frame(iri("http://news.unipv.it/"))
            .value(RDF.TYPE, Resources.Publisher)
            .value(DCTERMS.COVERAGE, Universities.University)
            .values(RDFS.LABEL,
                    literal("University of Pavia / News", "en"),
                    literal("Università di Pavia / News", Pavia.Language)
            );


    public static void main(final String... args) {
        Data.exec(() -> new EventsPaviaUniversity().run());
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final ZonedDateTime now=ZonedDateTime.now(UTC);


    @Override public void run() {
        Xtream.of(synced(Publisher.focus()))

                .flatMap(this::crawl)
                .map(this::event)

                .sink(events -> upload(Events.Context,
                        Validators._validate(Event(), Set.of(Events.Event), events)
                ));
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Xtream<Frame> crawl(final Instant synced) {
        return Xtream.of(7929, 7891, 8086, 8251)

                .flatMap(new Fill<Integer>()
                        .model("http://news.unipv.it/?feed=rss2&cat={category}")
                        .value("category")
                )

                .optMap(new GET<>(new XML()))

                .flatMap(new RSS());
    }

    private Frame event(final Frame frame) {
        return WordPress(frame, "it")

                .value(Resources.university, Pavia.Id)

                .frame(DCTERMS.PUBLISHER, Publisher)
                .value(DCTERMS.MODIFIED, frame.value(DCTERMS.MODIFIED).orElseGet(() -> literal(now)));
    }

}
