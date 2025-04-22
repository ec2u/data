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
import com.metreeca.mesh.Value;
import com.metreeca.mesh.meta.jsonld.Frame;
import com.metreeca.mesh.meta.jsonld.Virtual;

import eu.ec2u.data.datasets.Dataset;
import eu.ec2u.data.resources.Catalog;
import eu.ec2u.data.units.Unit;

import java.net.URI;
import java.util.Locale;
import java.util.Map;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.json.formats.JSON.store;
import static com.metreeca.mesh.Value.array;
import static com.metreeca.mesh.tools.Store.Options.FORCE;
import static com.metreeca.mesh.util.Collections.*;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.EC2U.DATA;
import static eu.ec2u.data.datasets.Datasets.DATASETS;
import static eu.ec2u.data.resources.Localized.EN;

@Frame
@Virtual
public interface Persons extends Dataset, Catalog<Unit> {

    URI PERSONS=DATA.resolve("/persons/");


    static void main(final String... args) {
        exec(() -> {

            final Value update=array(list(Xtream.of(new PersonsFrame())
                    .optMap(new Validate<>())
            ));

            service(store()).partition(PERSONS).update(update, FORCE);

        });
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    @Override
    default URI id() {
        return PERSONS;
    }


    @Override
    default Map<Locale, String> title() {
        return map(entry(EN, "EC2U Faculty, Researchers and Staff"));
    }

    @Override
    default Map<Locale, String> alternative() {
        return map(entry(EN, "EC2U People"));
    }

    @Override
    default Map<Locale, String> description() {
        return map(entry(EN, "Persons involved in teaching and research activities\nat EC2U allied universities."));
    }

    @Override
    default URI isDefinedBy() {
        return DATASETS.resolve("/persons");
    }

}
