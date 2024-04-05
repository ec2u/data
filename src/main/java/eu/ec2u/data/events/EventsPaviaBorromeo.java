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

import com.metreeca.http.work.Xtream;
import com.metreeca.link.Frame;

import eu.ec2u.data.Data;
import eu.ec2u.data.concepts.OrganizationTypes;
import eu.ec2u.data.things.Schema;
import eu.ec2u.work.feeds.Tribe;
import org.eclipse.rdf4j.model.IRI;

import static com.metreeca.link.Frame.*;

import static eu.ec2u.data.EC2U.update;
import static eu.ec2u.data.events.Events.publisher;
import static eu.ec2u.data.events.Events_.synced;
import static eu.ec2u.data.resources.Resources.owner;
import static eu.ec2u.data.things.Schema.Organization;
import static eu.ec2u.data.universities._Universities.Pavia;

public final class EventsPaviaBorromeo implements Runnable {

    private static final IRI Context=iri(Events.Context, "/pavia/borromeo");

    private static final com.metreeca.link.Frame Publisher=com.metreeca.link.Frame.frame(

            field(ID, iri("http://www.collegioborromeo.it/it/eventi/")),
            field(TYPE, Organization),

            field(owner, Pavia.Id),

            field(Schema.name,
                    literal("Almo Collegio Borromeo / Calendar", "en"),
                    literal("Almo Collegio Borromeo / Calendario", Pavia.Language)
            ),

            field(Schema.about, OrganizationTypes.College)

    );

    public static void main(final String... args) {
        Data.exec(() -> new EventsPaviaBorromeo().run());
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    @Override public void run() {
        update(connection -> Xtream

                .of(synced(Context, Publisher.id().orElseThrow()))

                .flatMap(new Tribe("http://www.collegioborromeo.it/it/")
                        .country(Pavia.Country)
                        .locality(Pavia.City)
                        .language(Pavia.Language)
                        .zone(Pavia.TimeZone)
                )

                .map(event -> frame(event,
                        field(owner, Pavia.Id),
                        field(publisher, Publisher)
                ))

                .flatMap(Frame::stream)
                .batch(0)

                .forEach(new Events_.Loader(Context))

        );
    }

}
