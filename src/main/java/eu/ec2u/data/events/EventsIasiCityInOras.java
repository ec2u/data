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

package eu.ec2u.data.events;

import com.metreeca.http.actions.Fill;
import com.metreeca.http.actions.GET;
import com.metreeca.http.work.Xtream;
import com.metreeca.http.xml.formats.XML;
import com.metreeca.link.Frame;

import eu.ec2u.data.Data;
import eu.ec2u.data.concepts.OrganizationTypes;
import eu.ec2u.data.things.Schema;
import eu.ec2u.work.feeds.RSS;
import org.eclipse.rdf4j.model.IRI;

import java.time.Instant;
import java.time.ZonedDateTime;

import static com.metreeca.link.Frame.*;

import static eu.ec2u.data.EC2U.update;
import static eu.ec2u.data.events.Events.publisher;
import static eu.ec2u.data.events.Events_.synced;
import static eu.ec2u.data.resources.Resources.owner;
import static eu.ec2u.data.universities._Universities.Iasi;
import static eu.ec2u.work.feeds.WordPress.WordPress;
import static java.time.ZoneOffset.UTC;

public final class EventsIasiCityInOras implements Runnable {

    public static final IRI Context=iri(Events.Context, "/iasi/in-oras");

    private static final com.metreeca.link.Frame Publisher=com.metreeca.link.Frame.frame(

            field(ID, iri("https://iasi.inoras.ro/evenimente")),
            field(TYPE, Schema.Organization),

            field(owner, Iasi.Id),

            field(Schema.name,
                    literal("InOras / Events in Iasi", "en"),
                    literal("InOras / Evenimente in Iași", Iasi.Language)
            ),

            field(Schema.about, OrganizationTypes.City)

    );


    public static void main(final String... args) {
        Data.exec(() -> new EventsIasiCityInOras().run());
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final ZonedDateTime now=ZonedDateTime.now(UTC);


    @Override public void run() {
        update(connection -> Xtream.of(synced(Context, Publisher.id().orElseThrow()))

                .flatMap(this::crawl)
                .map(this::event)

                .flatMap(Frame::stream)
                .batch(0)

                .forEach(new Events_.Loader(Context))

        );
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
        return frame(WordPress(frame, Iasi.Language),

                field(owner, Iasi.Id),
                field(publisher, Publisher)

        );
    }

}
