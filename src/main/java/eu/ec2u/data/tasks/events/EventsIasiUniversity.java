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

import com.metreeca.json.Frame;
import com.metreeca.rest.Xtream;
import com.metreeca.rest.actions.Validate;

import eu.ec2u.data.cities.Iasi;
import eu.ec2u.data.terms.EC2U;
import eu.ec2u.data.work.Tribe;
import org.eclipse.rdf4j.model.vocabulary.*;

import java.time.ZonedDateTime;

import static com.metreeca.json.Frame.frame;
import static com.metreeca.json.Values.iri;
import static com.metreeca.json.Values.literal;

import static eu.ec2u.data.ports.Events.Event;
import static eu.ec2u.data.tasks.Tasks.exec;
import static eu.ec2u.data.tasks.Tasks.upload;
import static eu.ec2u.data.tasks.events.Events.synced;

import static java.time.ZoneOffset.UTC;

public final class EventsIasiUniversity implements Runnable {

    private static final Frame Publisher=frame(iri("https://www.uaic.ro/"))
            .value(RDF.TYPE, EC2U.Publisher)
            .value(DCTERMS.COVERAGE, EC2U.University)
            .values(RDFS.LABEL,
                    literal("News and Events", "en")
            );


    public static void main(final String... args) {
        exec(() -> new EventsIasiUniversity().run());
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    @Override public void run() {

        final ZonedDateTime now=ZonedDateTime.now(UTC);

        Xtream.of(synced(Publisher.focus()))

                .flatMap(new Tribe("https://www.uaic.ro//")
                        .country(Iasi.City)
                        .locality(Iasi.Country)
                        .language(Iasi.Language)
                        .zone(Iasi.Zone)
                )

                .map(event -> event

                        .value(EC2U.university, Iasi.University)
                        .value(EC2U.updated, literal(now))

                        .frame(DCTERMS.PUBLISHER, Publisher)
                )

                .optMap(new Validate(Event()))

                .sink(events -> upload(EC2U.events, events));
    }

}
