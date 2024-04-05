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
import static eu.ec2u.data.events.Events_.synced;
import static eu.ec2u.data.resources.Resources.owner;
import static eu.ec2u.data.things.Schema.Organization;
import static eu.ec2u.data.universities._Universities.Pavia;
import static eu.ec2u.work.feeds.WordPress.WordPress;

public final class EventsPaviaUniversity implements Runnable {

    private static final IRI Context=iri(Events.Context, "/pavia/university");

    private static final com.metreeca.link.Frame Publisher=frame(

            field(ID, iri("http://news.unipv.it/")),
            field(TYPE, Organization),

            field(owner, Pavia.Id),

            field(Schema.name,
                    literal("University of Pavia / News", "en"),
                    literal("Università di Pavia / News", Pavia.Language)
            ),

            field(Schema.about, OrganizationTypes.University)

    );


    public static void main(final String... args) {
        exec(() -> new EventsPaviaUniversity().run());
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

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
        return Xtream.of(7929, 7891, 8086, 8251)

                .flatMap(new Fill<Integer>()
                        .model("http://news.unipv.it/?feed=rss2&cat={category}")
                        .value("category")
                )

                .optMap(new GET<>(new XML()))

                .flatMap(new RSS());
    }

    private Frame event(final Frame frame) {
        return frame(WordPress(frame, Pavia.Language),

                field(owner, Pavia.Id),
                field(publisher, Publisher)

        );
    }

}
