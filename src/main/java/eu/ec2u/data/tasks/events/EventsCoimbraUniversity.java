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

import eu.ec2u.data.cities.Coimbra;
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

public final class EventsCoimbraUniversity implements Runnable {

    private static final Frame Publisher=frame(iri("https://agenda.uc.pt/"))
            .value(RDF.TYPE, EC2U.Publisher)
            .value(DCTERMS.COVERAGE, EC2U.University)
            .values(RDFS.LABEL,
                    literal("University of Coimbra / Agenda UC", "en"),
                    literal("Universidade de Coimbra / Agenda UC", Coimbra.Language)
            );


    public static void main(final String... args) {
        exec(() -> new EventsCoimbraUniversity().run());
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    @Override public void run() {

        final ZonedDateTime now=ZonedDateTime.now(UTC);

        Xtream.of(synced(Publisher.focus()))

                .flatMap(new Tribe("https://agenda.uc.pt/")
                        .country(Coimbra.Country)
                        .locality(Coimbra.City)
                        .language(Coimbra.Language)
                        .zone(Coimbra.Zone)
                )

                .map(event -> event

                        .value(EC2U.university, Coimbra.University)

                        .frame(DCTERMS.PUBLISHER, Publisher)
                        .value(DCTERMS.MODIFIED, event.value(DCTERMS.MODIFIED).orElseGet(() -> literal(now)))

                )

                .optMap(new Validate(Event()))

                .sink(events -> upload(EC2U.events, events));
    }

}
