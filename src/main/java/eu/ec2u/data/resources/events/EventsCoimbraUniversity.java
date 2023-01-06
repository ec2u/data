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

package eu.ec2u.data.resources.events;

import com.metreeca.core.Xtream;
import com.metreeca.link.Frame;

import eu.ec2u.data.resources.Resources;
import eu.ec2u.data.resources.universities.Universities;
import eu.ec2u.data.utilities.feeds.Tribe;
import org.eclipse.rdf4j.model.vocabulary.*;

import java.time.ZonedDateTime;
import java.util.Set;

import static com.metreeca.link.Frame.frame;
import static com.metreeca.link.Values.iri;
import static com.metreeca.link.Values.literal;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data._delta.Uploads.upload;
import static eu.ec2u.data._ontologies.EC2U.Universities.Coimbra;
import static eu.ec2u.data.resources.events.Events.Event;
import static eu.ec2u.data.resources.events.Events_.synced;
import static eu.ec2u.data.utilities.validation.Validators.validate;

import static java.time.ZoneOffset.UTC;

public final class EventsCoimbraUniversity implements Runnable {

    private static final Frame Publisher=frame(iri("https://agenda.uc.pt/"))
            .value(RDF.TYPE, Resources.Publisher)
            .value(DCTERMS.COVERAGE, Universities.University)
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
                        .zone(Coimbra.TimeZone)
                )

                .map(event -> event

                        .value(Resources.university, Coimbra.Id)

                        .frame(DCTERMS.PUBLISHER, Publisher)
                        .value(DCTERMS.MODIFIED, event.value(DCTERMS.MODIFIED).orElseGet(() -> literal(now)))

                )

                .sink(events -> upload(Events.Context,
                        validate(Event(), Set.of(Events.Event), events)
                ));
    }

}
