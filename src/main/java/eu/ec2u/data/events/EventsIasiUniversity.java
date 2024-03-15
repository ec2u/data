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

import com.metreeca.http.rdf.Frame;

import eu.ec2u.data.Data;
import eu.ec2u.data.resources.Resources;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.vocabulary.DCTERMS;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.eclipse.rdf4j.model.vocabulary.RDFS;

import static com.metreeca.http.rdf.Frame.frame;
import static com.metreeca.http.rdf.Values.iri;
import static com.metreeca.http.rdf.Values.literal;

import static eu.ec2u.data.universities.Universities.University;
import static eu.ec2u.data.universities._Universities.Iasi;

public final class EventsIasiUniversity implements Runnable {

    private static final IRI Context=iri(Events.Context, "/iasi/university");

    private static final Frame Publisher=frame(iri("https://www.uaic.ro/"))
            .value(RDF.TYPE, Resources.Publisher)
            .value(DCTERMS.COVERAGE, University)
            .values(RDFS.LABEL,
                    literal("University of Iasi / Events", "en"),
                    literal("Universitatea din Iași / Evenimente", Iasi.Language)
            );


    public static void main(final String... args) {
        Data.exec(() -> new EventsIasiUniversity().run());
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    @Override public void run() {

        // final ZonedDateTime now=ZonedDateTime.now(UTC);
        //
        // Xtream.of(synced(Context, Publisher.focus()))
        //
        //         .flatMap(new Tribe("https://www.uaic.ro/")
        //                 .country(Iasi.Country)
        //                 .locality(Iasi.City)
        //                 .language(Iasi.Language)
        //                 .zone(Iasi.TimeZone)
        //         )
        //
        //         .map(event -> event
        //
        //                 .value(Resources.university, Iasi.Id)
        //
        //                 .frame(DCTERMS.PUBLISHER, Publisher)
        //                 .value(DCTERMS.MODIFIED, event.value(DCTERMS.MODIFIED).orElseGet(() -> literal(now)))
        //
        //         )
        //
        //         .pipe(events -> validate(Event(), Set.of(Event), events))
        //
        //         .forEach(new Events.Updater(Context));
    }

}
