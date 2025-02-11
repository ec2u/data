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

package eu.ec2u.data.datasets.taxonomies;


import eu.ec2u.data.datasets.organizations.OrganizationFrame;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.json.formats.JSON.store;
import static com.metreeca.mesh.Value.array;
import static com.metreeca.shim.Collections.entry;
import static com.metreeca.shim.Collections.map;
import static com.metreeca.shim.URIs.uri;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.datasets.Localized.EN;

public final class TopicsISCED implements Runnable {

    static final OrganizationFrame UNESCO_INSTITUTE_FOR_STATISTICS=new OrganizationFrame()
            .id(uri("http://www.uis.unesco.org/"))
            .prefLabel(map(entry(EN, "UNESCO Institute for Statistics")));


    public static void main(final String... args) {
        exec(() -> new TopicsISCED().run());
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    @Override public void run() {
        service(store()).insert(array(UNESCO_INSTITUTE_FOR_STATISTICS));
    }

}
