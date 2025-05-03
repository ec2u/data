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

package eu.ec2u.data.organizations;

import com.metreeca.mesh.meta.jsonld.Frame;

import eu.ec2u.data.datasets.Dataset;
import eu.ec2u.data.persons.PersonsFrame;

import java.util.Set;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.json.formats.JSON.store;
import static com.metreeca.mesh.util.Collections.*;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.EC2U.*;
import static eu.ec2u.data.resources.Localized.EN;

@Frame
public interface Organizations extends Dataset {

    PersonsFrame ORGANIZATIONS=new PersonsFrame()
            .id(DATA.resolve("organizations/"))
            .isDefinedBy(DATA.resolve("datasets/organizations"))
            .title(map(entry(EN, "EC2U Related Organizations")))
            .alternative(map(entry(EN, "EC2U Organizations")))
            .description(map(entry(EN, "Organizations involved in activities related to EC2U allied universities.")))
            .publisher(EC2U)
            .rights(COPYRIGHT)
            .license(set(LICENSE));


    static void main(final String... args) {
        exec(() -> service(store()).partition(ORGANIZATIONS.id()).insert(ORGANIZATIONS));
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    @Override
    Set<Organization> members();

}
