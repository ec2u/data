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

import com.metreeca.flow.http.handlers.Delegator;
import com.metreeca.flow.http.handlers.Router;

import eu.ec2u.data.datasets.Datasets;
import eu.ec2u.data.documents.Documents;
import eu.ec2u.data.events.Events;
import eu.ec2u.data.organizations.OrgOrganizationFrame;
import eu.ec2u.data.resources.ReferenceFrame;
import eu.ec2u.data.resources.Resources;
import eu.ec2u.data.taxonomies.Taxonomies;
import eu.ec2u.data.units.Units;
import eu.ec2u.data.universities.Universities;

import java.net.URI;
import java.util.Map;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.json.formats.JSON.store;
import static com.metreeca.mesh.Value.array;
import static com.metreeca.mesh.util.Collections.entry;
import static com.metreeca.mesh.util.Collections.map;
import static com.metreeca.mesh.util.URIs.uri;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.resources.Localized.EN;
import static java.util.Locale.ROOT;


public final class EC2U extends Delegator {

    public static final String BASE="https://data.ec2u.eu/";

    public static final URI DATA=uri(BASE);


    public static final OrgOrganizationFrame EC2U=new OrgOrganizationFrame()
            .id(uri("https://ec2u.eu/"))
            .prefLabel(map(entry(EN, "European Campus of City-Universities")))
            .altLabel(map(entry(EN, "EC2U")));

    public static final ReferenceFrame CCBYNCND40=new ReferenceFrame()
            .id(uri("https://creativecommons.org/licenses/by-nc-nd/4.0/"))
            .label(Map.of(ROOT, "CC BY-NC-ND 4.0"))
            .comment(Map.of(ROOT, "Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International"));

    public static final String COPYRIGHT="Copyright © 2022‑2025 EC2U Alliance";


    public static void main(final String... args) {
        exec(() -> service(store()).modify(array(EC2U, CCBYNCND40)));
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    public EC2U() {
        delegate(new Router()

                        .path("/", new Datasets.Handler())
                        .path("/resources/*", new Resources.Handler())
                        .path("/taxonomies/*", new Taxonomies.Handler())
                        .path("/universities/*", new Universities.Handler())
                        .path("/units/*", new Units.Handler())
                        // !!! .path("/programs/*", new Programs())
                        // !!! .path("/courses/*", new Courses())
                        .path("/documents/*", new Documents.Handler())
                        .path("/events/*", new Events.Handler())
                // !!! .path("/actors/*", new Actors())

        );
    }

}
