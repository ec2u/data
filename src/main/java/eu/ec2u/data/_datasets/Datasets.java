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

import com.metreeca.flow.Handler;
import com.metreeca.flow.handlers.Worker;
import com.metreeca.flow.json.handlers.Relator;
import com.metreeca.mesh.meta.jsonld.Frame;
import com.metreeca.mesh.meta.jsonld.Namespace;
import com.metreeca.mesh.meta.jsonld.Virtual;

import eu.ec2u.data._organizations.OrgOrganization;
import eu.ec2u.data._resources.Catalog;
import eu.ec2u.data._resources.Reference;

import java.net.URI;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.json.formats.JSON.store;
import static com.metreeca.mesh.queries.Query.query;
import static com.metreeca.mesh.util.Collections.*;
import static com.metreeca.mesh.util.Locales.ANY;
import static com.metreeca.mesh.util.URIs.uri;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data._EC2U.EC2U;
import static eu.ec2u.data._datasets.DatasetFrame.Dataset;
import static eu.ec2u.data._datasets.DatasetFrame.model;
import static eu.ec2u.data._datasets.DatasetsFrame.Datasets;
import static eu.ec2u.data._datasets.DatasetsFrame.model;
import static eu.ec2u.data._datasets.DatasetsFrame.value;
import static eu.ec2u.data._resources.Localized.EN;

@Frame
@Virtual
@Namespace("[ec2u]")
public interface Datasets extends Dataset, Catalog<Dataset> {

    URI METADATA=uri("/datasets/");


    @Override
    default URI id() {
        return uri("/");
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
        return METADATA;
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

    static void main(final String... args) {
        exec(() -> service(store()).update(value(Datasets()), true));
    }

    static Handler datasets() {
        return new Worker().get(new Relator(model(Datasets()

                .id(uri())
                .label(map(entry(ANY, "")))

                .members(stash(query()

                        .model(model(Dataset()

                                .id(uri())
                                .label(map(entry(ANY, "")))

                        ))

                ))

        )));
    }

}
