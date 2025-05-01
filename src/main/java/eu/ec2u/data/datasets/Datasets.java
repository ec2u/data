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

import com.metreeca.flow.http.handlers.Delegator;
import com.metreeca.flow.http.handlers.Worker;
import com.metreeca.flow.json.actions.Validate;
import com.metreeca.flow.json.handlers.Driver;
import com.metreeca.flow.work.Xtream;
import com.metreeca.mesh.meta.jsonld.Frame;
import com.metreeca.mesh.meta.jsonld.Namespace;

import java.util.Set;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.json.formats.JSON.store;
import static com.metreeca.mesh.Value.array;
import static com.metreeca.mesh.queries.Criterion.criterion;
import static com.metreeca.mesh.queries.Query.query;
import static com.metreeca.mesh.tools.Store.Options.FORCE;
import static com.metreeca.mesh.util.Collections.*;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.EC2U.*;
import static eu.ec2u.data.resources.Localized.EN;

@Frame
@Namespace("[ec2u]")
public interface Datasets extends Dataset {

    DatasetsFrame DATASETS=new DatasetsFrame()
            .id(DATA.resolve("/"))
            .isDefinedBy(DATA.resolve("datasets"))
            .title(map(entry(EN, "EC2U Dataset Catalog")))
            .alternative(map(entry(EN, "EC2U Datasets")))
            .description(map(entry(EN, "Datasets published on the EC2U Knowledge Hub.")))
            .publisher(EC2U)
            .rights(COPYRIGHT)
            .license(set(LICENSE));


    static void main(final String... args) {
        exec(() -> service(store()).partition(DATASETS.id()).update(array(list(

                Xtream.of(DATASETS)
                        .optMap(new Validate<>())

        )), FORCE));
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    @Override
    Set<Dataset> members();


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    final class Handler extends Delegator {

        public Handler() {

            delegate(new Worker().get(new Driver(new DatasetsFrame(true)

                    .members(stash(query(new DatasetFrame(true))
                            .where("issued", criterion().any(set()))
                    ))

            )));
        }

    }

}
