/*
 * Copyright © 2020-2025 EC2U Alliance
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

package eu.ec2u.data;

import com.metreeca.flow.handlers.Delegator;
import com.metreeca.flow.handlers.Router;

import eu.ec2u.data.datasets.Datasets;
import eu.ec2u.data.organizations.OrgOrganizationFrame;
import eu.ec2u.data.resources.Resources;
import eu.ec2u.data.units.Units;
import eu.ec2u.data.universities.Universities;

import java.net.URI;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.json.formats.JSON.store;
import static com.metreeca.mesh.tools.Store.Options.FORCE;
import static com.metreeca.mesh.util.Collections.entry;
import static com.metreeca.mesh.util.Collections.map;
import static com.metreeca.mesh.util.URIs.uri;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.resources.Localized.EN;


public final class EC2U extends Delegator {

    public static final String BASE="https://data.ec2u.eu/";

    public static final URI DATA=uri(BASE);

    public static final OrgOrganizationFrame EC2U=new OrgOrganizationFrame()
            .id(uri("https://ec2u.eu/"))
            .prefLabel(map(entry(EN, "European Campus of City-Universities")))
            .altLabel(map(entry(EN, "EC2U")));


    public static void main(final String... args) {
        exec(() -> service(store()).update(EC2U, FORCE));
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    public EC2U() {
        delegate(new Router()

                        .path("/", new Datasets.Handler())
                        .path("/resources/*", new Resources.Handler())
                        // !!! .path("/assets/*", new Resources())
                        // !!! .path("/concepts/*", new Concepts())
                        // !!! .path("/agents/*", new Agents())
                        .path("/universities/*", new Universities.Handler())
                        .path("/units/*", new Units.Handler())
                // !!! .path("/documents/*", new Documents())
                // !!! .path("/actors/*", new Actors())
                // !!! .path("/things/*", new Schema())
                // !!! .path("/events/*", new Events())
                // !!! .path("/offerings/*", new Offerings())
                // !!! .path("/programs/*", new Programs())
                // !!! .path("/courses/*", new Courses())

        );
    }

}
