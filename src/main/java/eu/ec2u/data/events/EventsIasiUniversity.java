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

import eu.ec2u.data.concepts.OrganizationTypes;
import eu.ec2u.data.things.Schema;
import eu.ec2u.work.feeds.Tribe;
import org.eclipse.rdf4j.model.IRI;

import java.time.Instant;

import static com.metreeca.link.Frame.*;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.EC2U.update;
import static eu.ec2u.data.events.Events.publisher;
import static eu.ec2u.data.resources.Resources.university;
import static eu.ec2u.data.universities.University.Iasi;

public final class EventsIasiUniversity implements Runnable {

    private static final IRI Context=iri(Events.Context, "/iasi/university");

    private static final Frame Publisher=frame(

            field(ID, iri("https://www.uaic.ro/")),
            field(TYPE, Schema.Organization),

            field(university, Iasi.id),

            field(Schema.name,
                    literal("University of Iasi / Events", "en"),
                    literal("Universitatea din Iași / Evenimente", Iasi.language)
            ),

            field(Schema.about, OrganizationTypes.University)

    );


    public static void main(final String... args) {
        exec(() -> new EventsIasiUniversity().run());
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    @Override public void run() {
        update(connection -> Xtream.of(Instant.now())

                .flatMap(new Tribe("https://www.uaic.ro/")
                        .country(Iasi.country)
                        .locality(Iasi.city)
                        .language(Iasi.language)
                        .zone(Iasi.zone)
                )

                .map(event -> frame(event,
                        field(university, Iasi.id),
                        field(publisher, Publisher)
                ))

                .flatMap(Frame::stream)
                .batch(0)

                .forEach(new Events_.Loader(Context))

        );
    }

}
