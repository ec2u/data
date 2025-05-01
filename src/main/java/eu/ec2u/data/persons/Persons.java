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

import com.metreeca.flow.json.actions.Validate;
import com.metreeca.flow.work.Xtream;
import com.metreeca.mesh.meta.jsonld.Frame;

import eu.ec2u.data.datasets.Dataset;
import eu.ec2u.data.datasets.Datasets;

import java.util.Set;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.json.formats.JSON.store;
import static com.metreeca.mesh.Value.array;
import static com.metreeca.mesh.tools.Store.Options.FORCE;
import static com.metreeca.mesh.util.Collections.*;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.EC2U.*;
import static eu.ec2u.data.resources.Localized.EN;

@Frame
public interface Persons extends Dataset {

    Persons PERSONS=new PersonsFrame()
            .id(DATA.resolve("persons/"))
            .isDefinedBy(Datasets.DATASETS.id().resolve("persons"))
            .title(map(entry(EN, "EC2U Faculty, Researchers and Staff")))
            .alternative(map(entry(EN, "EC2U People")))
            .description(map(entry(EN, "Staff involved in teaching and research activities at EC2U allied universities.")))
            .publisher(EC2U)
            .rights(COPYRIGHT)
            .license(set(CCBYNCND40));


    static void main(final String... args) {
        exec(() -> service(store()).partition(PERSONS.id()).update(array(list(

                Xtream.of(new PersonsFrame())
                        .optMap(new Validate<>())

        )), FORCE));
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    @Override
    Set<Person> members();

}
