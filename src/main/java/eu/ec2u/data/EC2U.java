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
import com.metreeca.flow.json.actions.Validate;
import com.metreeca.flow.work.Xtream;
import com.metreeca.mesh.Value;

import eu.ec2u.data.datasets.Datasets;
import eu.ec2u.data.documents.Documents;
import eu.ec2u.data.organizations.OrgOrganizationFrame;
import eu.ec2u.data.resources.Collection;
import eu.ec2u.data.resources.Reference;
import eu.ec2u.data.resources.Resources;
import eu.ec2u.data.taxonomies.Taxonomies;
import eu.ec2u.data.units.Units;
import eu.ec2u.data.universities.Universities;

import java.net.URI;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.json.formats.JSON.store;
import static com.metreeca.mesh.Value.array;
import static com.metreeca.mesh.tools.Store.Option.FORCED;
import static com.metreeca.mesh.util.Collections.*;
import static com.metreeca.mesh.util.URIs.uri;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.resources.Localized.EN;


public final class EC2U extends Delegator {

    public static final String BASE="https://data.ec2u.eu/";

    public static final URI DATA=uri(BASE);
    public static final URI EMBEDDINGS=DATA.resolve("~embeddings");


    public static final OrgOrganizationFrame EC2U=new OrgOrganizationFrame()
            .id(uri("https://ec2u.eu/"))
            .prefLabel(map(entry(EN, "European Campus of City-Universities")))
            .altLabel(map(entry(EN, "EC2U")));

    public static final String COPYRIGHT="Copyright © 2022‑2025 EC2U Alliance";
    public static final Reference LICENSE=Collection.CCBYNCND40;


    public static void main(final String... args) {
        exec(() -> {

            final Value update=array(list(Xtream.of(EC2U)
                    .optMap(new Validate<>())
            ));

            service(store()).update(update, FORCED);

        });
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    public EC2U() {
        delegate(new Router()

                        .path("/", new Datasets.Handler())
                        .path("/resources/*", new Resources.Handler())
                        .path("/taxonomies/*", new Taxonomies.Handler())
                        .path("/universities/*", new Universities.Handler())
                        .path("/units/*", new Units.Handler())
                // !!! .path("/offerings/*", new Offerings())
                // !!! .path("/programs/*", new Programs())
                // !!! .path("/courses/*", new Courses())
                        .path("/documents/*", new Documents.Handler())
                // !!! .path("/events/*", new Events())
                // !!! .path("/actors/*", new Actors())

        );
    }

}
