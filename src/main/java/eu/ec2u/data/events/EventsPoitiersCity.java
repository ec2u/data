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

import com.metreeca.link.Frame;

import eu.ec2u.data.concepts.OrganizationTypes;
import eu.ec2u.data.things.Schema;
import org.eclipse.rdf4j.model.IRI;

import java.time.Instant;
import java.time.OffsetDateTime;

import static com.metreeca.link.Frame.*;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.resources.Resources.owner;
import static eu.ec2u.data.things.Schema.Organization;
import static eu.ec2u.data.universities._Universities.Poitiers;
import static java.time.ZoneOffset.UTC;

public final class EventsPoitiersCity implements Runnable {

    private static final IRI Context=iri(Events.Context, "/poitiers/city");

    private static final Frame Publisher=frame(

            field(ID, iri("https://www.poitiers.fr/")),
            field(TYPE, Organization),

            field(owner, Poitiers.Id),

            field(Schema.name,

                    literal("City of Poitiers / Events", "en"),
                    literal("Ville de Poitiers / Evenements", Poitiers.Language)
            ),

            field(Schema.about, OrganizationTypes.City)

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
