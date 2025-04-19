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
import com.metreeca.mesh.queries.Table;

import eu.ec2u.data.__._Data;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.json.formats.JSON.store;
import static com.metreeca.mesh.Value.*;
import static com.metreeca.mesh.queries.Expression.expression;
import static com.metreeca.mesh.queries.Probe.probe;
import static com.metreeca.mesh.queries.Query.query;
import static com.metreeca.mesh.tools.Store.Options.FORCE;
import static com.metreeca.mesh.util.Collections.list;
import static com.metreeca.mesh.util.Collections.stash;
import static com.metreeca.mesh.util.URIs.uri;

import static eu.ec2u.data.__._EC2U.DATA;

public final class Housekeeper implements Runnable {

    public static void main(final String... args) {
        _Data.exec(() -> new Housekeeper().run());
    }

    @Override
    public void run() {
        service(store()).execute(store -> {

            final Value stats=store.retrieve(new DatasetsFrame(true).id(DATA)

                    .members(stash(query(
                            probe("dataset", expression(), object(id(uri()))),
                            probe("entities", expression("count:resources"), Integer())
                    )))

            );

            final Value mutation=array(list(stats.get("members").value(Table.class).stream()
                    .flatMap(table -> table.rows().stream())
                    .map(tuple -> new DatasetFrame(true)
                            .id(tuple.value("dataset").flatMap(Value::id).orElse(null))
                            .entities(tuple.value("entities").flatMap(Value::integral).orElse(0L).intValue()))
            ));

            store.partition(Datasets.DATASETS.resolve("~")).mutate(mutation, FORCE);

        });
    }

}
