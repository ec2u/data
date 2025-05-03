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

package eu.ec2u.data.persons;

import com.metreeca.mesh.meta.jsonld.Frame;

import eu.ec2u.data.datasets.Dataset;

import java.util.Set;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.json.formats.JSON.store;
import static com.metreeca.mesh.util.Collections.*;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.EC2U.*;
import static eu.ec2u.data.resources.Localized.EN;

@Frame
public interface Persons extends Dataset {

    PersonsFrame PERSONS=new PersonsFrame()
            .id(DATA.resolve("persons/"))
            .isDefinedBy(DATA.resolve("datasets/persons"))
            .title(map(entry(EN, "EC2U Faculty, Researchers and Staff")))
            .alternative(map(entry(EN, "EC2U People")))
            .description(map(entry(EN, "Staff involved in teaching and research activities at EC2U allied universities.")))
            .publisher(EC2U)
            .rights(COPYRIGHT)
            .license(set(LICENSE));


    static void main(final String... args) {
        exec(() -> service(store()).partition(PERSONS.id()).clear().insert(PERSONS));
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    @Override
    Set<Person> members();

}
