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

import com.metreeca.link.Frame;

import eu.ec2u.data.resources.Resources;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.vocabulary.*;

import java.time.Instant;
import java.time.OffsetDateTime;

import static com.metreeca.link.Frame.frame;
import static com.metreeca.link.Values.iri;
import static com.metreeca.link.Values.literal;

import static eu.ec2u.data.Data.exec;

import static java.time.ZoneOffset.UTC;

public final class EventsPoitiersCity implements Runnable {

    private static final IRI Context=iri(Events.Context, "/poitiers/city");

    private static final Frame Publisher=frame(iri("https://www.poitiers.fr/"))
            .value(RDF.TYPE, Resources.Publisher)
            .value(DCTERMS.COVERAGE, Events.City)
            .values(RDFS.LABEL,
                    literal("Ville de Poitiers / Evenements", "fr"),
                    literal("City of Poitiers / Events", "en")
            );


    public static void main(final String... args) {
        exec(() -> new EventsPoitiersCity().run());
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final OffsetDateTime now=Instant.now().atOffset(UTC);


    @Override public void run() {
        throw new UnsupportedOperationException(";(  be implemented"); // !!!
    }

}
