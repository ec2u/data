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

import eu.ec2u.data.concepts.OrganizationTypes;
import eu.ec2u.data.things.Schema;
import eu.ec2u.work.feeds.RSS;
import org.eclipse.rdf4j.model.IRI;

import java.time.Instant;

import static com.metreeca.link.Frame.*;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.EC2U.update;
import static eu.ec2u.data.events.Events.publisher;
import static eu.ec2u.data.events.Events.startDate;
import static eu.ec2u.data.resources.Resources.university;
import static eu.ec2u.data.universities.University.Iasi;
import static eu.ec2u.work.feeds.WordPress.WordPress;
import static java.time.Instant.now;

public final class EventsIasiCityCultura implements Runnable {

    public static final IRI Context=iri(Events.Context, "/iasi/cultura");

    private static final Frame Publisher=frame(

            field(ID, iri("https://culturainiasi.ro/evenimente-culturale/")),
            field(TYPE, Schema.Organization),

            field(university, Iasi.id),

            field(Schema.name,
                    literal("Iaşul Cultural / Evenimente in Iași", Iasi.language),
                    literal("Culture in Iasi / Events in Iasi", "en")
            ),

            field(Schema.about, OrganizationTypes.City)

    );


    public static void main(final String... args) {
        exec(() -> new EventsIasiCityCultura().run());
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    @Override public void run() {
        update(connection -> Xtream.of(now())

                .flatMap(this::crawl)
                .map(this::event)

                .filter(frame -> frame.value(startDate).isPresent())

                .flatMap(Frame::stream)
                .batch(0)

                .forEach(new Events_.Loader(Context))

        );
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Xtream<Frame> crawl(final Instant now) {
        return Xtream.of(now)

                .flatMap(new Fill<Instant>()
                        .model("https://culturainiasi.ro/feed")
                )

                .optMap(new GET<>(new XML()))

                .flatMap(new RSS());
    }

    private Frame event(final Frame frame) {
        return frame(WordPress(frame, Iasi.language),

                field(university, Iasi.id),
                field(publisher, Publisher)

        );
    }

}
