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

package eu.ec2u.data._datasets;

import com.metreeca.mesh.Value;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.json.formats.JSON.store;
import static com.metreeca.mesh.Value.Integer;
import static com.metreeca.mesh.Value.value;
import static com.metreeca.mesh.queries.Expression.expression;
import static com.metreeca.mesh.queries.Probe.probe;
import static com.metreeca.mesh.queries.Query.query;
import static com.metreeca.mesh.queries.Specs.specs;
import static com.metreeca.mesh.util.Collections.stash;
import static com.metreeca.mesh.util.URIs.uri;

import static eu.ec2u.data._Data.exec;
import static eu.ec2u.data._EC2U.BASE;
import static eu.ec2u.data._datasets.DatasetFrame.Dataset;
import static eu.ec2u.data._datasets.DatasetFrame.model;
import static eu.ec2u.data._datasets.DatasetsFrame.Datasets;
import static eu.ec2u.data._datasets.DatasetsFrame.model;

public final class Work {

    public static void main(final String... args) {
        exec(() -> {

            final Value value=service(store()).retrieve(model(Datasets()

                    .id(uri(BASE))

                    .members(stash(query()

                            .model(value(specs(
                                    probe("dataset", expression(), model(Dataset().id(uri()))),
                                    probe("resources", expression("count:resources"), Integer())
                            )))

                    ))

            ));

            System.out.println(value);

        });
    }
}
