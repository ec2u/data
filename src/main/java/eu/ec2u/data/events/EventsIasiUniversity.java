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
import com.metreeca.link.Frame;

import eu.ec2u.data.Data;
import eu.ec2u.data.resources.Resources;
import eu.ec2u.data.universities.Universities;
import eu.ec2u.work.feeds.Tribe;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.vocabulary.*;

import java.time.ZonedDateTime;
import java.util.Set;

import static com.metreeca.link.Frame.frame;
import static com.metreeca.link.Values.iri;
import static com.metreeca.link.Values.literal;

import static eu.ec2u.data.EC2U.University.Iasi;
import static eu.ec2u.data.events.Events.Event;
import static eu.ec2u.data.events.Events.synced;
import static eu.ec2u.work.validation.Validators.validate;

import static java.time.ZoneOffset.UTC;

public final class EventsIasiUniversity implements Runnable {

    private static final IRI Context=iri(Events.Context, "/iasi/university");

    private static final Frame Publisher=frame(iri("https://www.uaic.ro/"))
            .value(RDF.TYPE, Resources.Publisher)
            .value(DCTERMS.COVERAGE, Universities.University)
            .values(RDFS.LABEL,
                    literal("University of Iasi / Events", "en"),
                    literal("Universitatea din Iași / Evenimente", Iasi.Language)
            );


    public static void main(final String... args) {
        Data.exec(() -> new EventsIasiUniversity().run());
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    @Override public void run() {

        final ZonedDateTime now=ZonedDateTime.now(UTC);

        Xtream.of(synced(Context, Publisher.focus()))

                .flatMap(new Tribe("https://www.uaic.ro/")
                        .country(Iasi.Country)
                        .locality(Iasi.City)
                        .language(Iasi.Language)
                        .zone(Iasi.TimeZone)
                )

                .map(event -> event

                        .value(Resources.university, Iasi.Id)

                        .frame(DCTERMS.PUBLISHER, Publisher)
                        .value(DCTERMS.MODIFIED, event.value(DCTERMS.MODIFIED).orElseGet(() -> literal(now)))

                )

                .pipe(events -> validate(Event(), Set.of(Event), events))

                .forEach(new Events.Updater(Context));
    }

}
