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

package eu.ec2u.data.datasets;

import com.metreeca.flow.handlers.Delegator;
import com.metreeca.flow.handlers.Worker;
import com.metreeca.flow.json.actions.Validate;
import com.metreeca.flow.json.handlers.Driver;
import com.metreeca.flow.work.Xtream;
import com.metreeca.mesh.Value;
import com.metreeca.mesh.meta.jsonld.Frame;
import com.metreeca.mesh.meta.jsonld.Namespace;
import com.metreeca.mesh.meta.jsonld.Virtual;

import eu.ec2u.data.Data;
import eu.ec2u.data.resources.Catalog;

import java.net.URI;
import java.util.Locale;
import java.util.Map;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.json.formats.JSON.store;
import static com.metreeca.mesh.Value.array;
import static com.metreeca.mesh.queries.Criterion.criterion;
import static com.metreeca.mesh.queries.Query.query;
import static com.metreeca.mesh.tools.Store.Options.FORCE;
import static com.metreeca.mesh.util.Collections.*;

import static eu.ec2u.data.EC2U.DATA;
import static eu.ec2u.data.resources.Localized.EN;

@Frame
@Virtual
@Namespace("[ec2u]")
public interface Datasets extends Dataset, Catalog<Dataset> {

    URI DATASETS=DATA.resolve("datasets/");


    static void main(final String... args) {
        Data.exec(() -> {

            final Value update=array(list(Xtream.of(new DatasetsFrame())
                    .optMap(new Validate<>())
            ));

            service(store()).partition(DATASETS).update(update, FORCE);

        });
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    @Override
    default URI id() {
        return DATA;
    }


    @Override
    default Map<Locale, String> title() {
        return map(entry(EN, "EC2U Dataset Catalog"));
    }

    @Override
    default Map<Locale, String> alternative() {
        return map(entry(EN, "EC2U Datasets"));
    }

    @Override
    default Map<Locale, String> description() {
        return map(entry(EN, "Datasets published on the EC2U Knowledge Hub."));
    }

    @Override
    default URI isDefinedBy() {
        return DATASETS;
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    final class Handler extends Delegator {

        public Handler() {

            delegate(new Worker().get(new Driver(new DatasetsFrame()

                    .members(stash(query(new DatasetFrame())
                            .where("issued", criterion().any(set()))
                    ))

            )));
        }

    }

}
