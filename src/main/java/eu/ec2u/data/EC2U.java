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

import com.metreeca.mesh.meta.jsonld.Frame;

import eu.ec2u.data.organizations.Organization;
import eu.ec2u.data.resources.ReferenceFrame;
import eu.ec2u.data.vocabularies.org.OrgOrganizationalCollaboration;

import java.net.URI;
import java.util.Map;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.json.formats.JSON.store;
import static com.metreeca.mesh.Value.array;
import static com.metreeca.shim.Collections.entry;
import static com.metreeca.shim.Collections.map;
import static com.metreeca.shim.URIs.uri;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.resources.Localized.EN;
import static java.util.Locale.ROOT;


@Frame
public interface EC2U extends Organization, OrgOrganizationalCollaboration {

    String BASE="https://data.ec2u.eu/";

    URI DATA=uri(BASE);


    EC2UFrame EC2U=new EC2UFrame()
            .id(uri("https://ec2u.eu/"))
            .prefLabel(map(entry(EN, "European Campus of City-Universities")))
            .altLabel(map(entry(EN, "EC2U")));


    ReferenceFrame CCBYNCND40=new ReferenceFrame()
            .id(uri("https://creativecommons.org/licenses/by-nc-nd/4.0/"))
            .label(Map.of(ROOT, "CC BY-NC-ND 4.0"))
            .comment(Map.of(ROOT, "Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International"));

    String COPYRIGHT="Copyright © 2022‑2025 EC2U Alliance";


    static void main(final String... args) {
        exec(() -> service(store()).insert(array(EC2U, CCBYNCND40)));
    }

}
