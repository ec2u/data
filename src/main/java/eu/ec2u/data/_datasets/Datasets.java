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

import com.metreeca.flow.handlers.Delegator;
import com.metreeca.flow.handlers.Worker;
import com.metreeca.flow.json.actions.Validate;
import com.metreeca.flow.json.handlers.Relator;
import com.metreeca.flow.work.Xtream;
import com.metreeca.mesh.Value;
import com.metreeca.mesh.meta.jsonld.Frame;
import com.metreeca.mesh.meta.jsonld.Namespace;
import com.metreeca.mesh.meta.jsonld.Virtual;
import com.metreeca.mesh.queries.Table;

import eu.ec2u.data.__._Data;
import eu.ec2u.data._organizations.OrgOrganization;
import eu.ec2u.data._resources.Catalog;
import eu.ec2u.data._resources.Reference;

import java.net.URI;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.json.formats.JSON.store;
import static com.metreeca.mesh.Value.*;
import static com.metreeca.mesh.queries.Criterion.criterion;
import static com.metreeca.mesh.queries.Expression.expression;
import static com.metreeca.mesh.queries.Probe.probe;
import static com.metreeca.mesh.queries.Query.query;
import static com.metreeca.mesh.queries.Specs.specs;
import static com.metreeca.mesh.tools.Store.Options.FORCE;
import static com.metreeca.mesh.util.Collections.*;
import static com.metreeca.mesh.util.Locales.ANY;
import static com.metreeca.mesh.util.URIs.uri;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.__._EC2U.DATA;
import static eu.ec2u.data.__._EC2U.EC2U;
import static eu.ec2u.data._datasets.DatasetsFrame.model;
import static eu.ec2u.data._resources.Localized.EN;

@Frame
@Virtual
@Namespace("[ec2u]")
public interface Datasets extends Dataset, Catalog<Dataset> {

    URI DATASETS=DATA.resolve("/datasets/");


    static void main(final String... args) {
        exec(() -> {

            final Value update=array(list(Xtream.of(new DatasetsFrame())

                    .map(DatasetFrame::value)
                    .optMap(new Validate())

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


    @Override
    default String rights() {
        return "Copyright © 2022‑2025 EC2U Alliance";
    }

    @Override
    default OrgOrganization publisher() {
        return EC2U;
    }

    @Override
    default Set<Reference> license() {
        return set(CCBYNCND40);
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    final class Handler extends Delegator {

        public Handler() {

            delegate(new Worker().get(new Relator(DatasetsFrame.model(new DatasetsFrame()

                    .id(uri())
                    .label(map(entry(ANY, "")))

                    .members(stash(query()

                            .model(DatasetFrame.model(new DatasetFrame()

                                    .id(uri())
                                    .label(map(entry(ANY, "")))

                            ))

                            .criterion("issued", criterion().any(set()))

                    ))

            ))));
        }

    }

    final class Housekeeper implements Runnable {

        public static void main(final String... args) {
            _Data.exec(() -> new Housekeeper().run());
        }

        @Override
        public void run() {
            service(store()).execute(store -> {

                final Value stats=store.retrieve(model(new DatasetsFrame()

                        .id(DATA)

                        .members(stash(query()

                                .model(value(specs(
                                        probe("dataset", expression(), object(Value.id(uri()))),
                                        probe("entities", expression("count:resources"), Integer())
                                )))

                        ))

                ));

                final Value mutation=array(list(stats.get("members").value(Table.class).stream()
                        .flatMap(table -> table.rows().stream())
                        .map(tuple -> model(new DatasetsFrame()
                                .id(tuple.value("dataset").flatMap(Value::id).orElse(null))
                                .entities(tuple.value("entities").flatMap(Value::integral).orElse(0L).intValue())
                        ))
                ));

                store.partition(DATASETS.resolve("~")).mutate(mutation, FORCE);

            });
        }

    }

}
