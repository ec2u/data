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

import eu.ec2u.data.resources.Resources;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.vocabulary.DCTERMS;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.eclipse.rdf4j.model.vocabulary.RDFS;

import static com.metreeca.http.rdf.Frame.frame;
import static com.metreeca.http.rdf.Values.iri;
import static com.metreeca.http.rdf.Values.literal;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.universities.Universities.University;
import static eu.ec2u.data.universities._Universities.Coimbra;

public final class EventsCoimbraUniversity implements Runnable {

    public static final IRI Context=iri(Events.Context, "/coimbra/university");

    private static final Frame Publisher=frame(iri("https://agenda.uc.pt/"))
            .value(RDF.TYPE, Resources.Publisher)
            .value(DCTERMS.COVERAGE, University)
            .values(RDFS.LABEL,
                    literal("University of Coimbra / Agenda UC", "en"),
                    literal("Universidade de Coimbra / Agenda UC", Coimbra.Language)
            );


    public static void main(final String... args) {
        exec(() -> new EventsCoimbraUniversity().run());
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    @Override public void run() {

        // final ZonedDateTime now=ZonedDateTime.now(UTC);
        //
        // Xtream.of(synced(Context, Publisher.focus()))
        //
        //         .flatMap(new Tribe("https://agenda.uc.pt/")
        //                 .country(Coimbra.Country)
        //                 .locality(Coimbra.City)
        //                 .language(Coimbra.Language)
        //                 .zone(Coimbra.TimeZone)
        //         )
        //
        //         .map(event -> event
        //
        //                 .value(Resources.university, Coimbra.Id)
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
