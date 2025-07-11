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
import com.metreeca.flow.json.handlers.Driver;
import com.metreeca.mesh.meta.jsonld.Frame;
import com.metreeca.mesh.meta.jsonld.Namespace;

import eu.ec2u.data.Data;

import java.util.Map;
import java.util.Set;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.json.formats.JSON.store;
import static com.metreeca.mesh.Value.array;
import static com.metreeca.mesh.queries.Criterion.criterion;
import static com.metreeca.shim.Collections.*;
import static com.metreeca.shim.URIs.uri;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.datasets.Localized.EN;
import static eu.ec2u.data.datasets.organizations.Organizations.EC2U;
import static java.util.Locale.ROOT;

@Frame
@Namespace("[ec2u]")
public interface Datasets extends Dataset {

    String COPYRIGHT="Copyright © 2022‑2025 EC2U Alliance";

    ReferenceFrame CCBYNCND40=new ReferenceFrame()
            .id(uri("https://creativecommons.org/licenses/by-nc-nd/4.0/"))
            .label(Map.of(ROOT, "CC BY-NC-ND 4.0"))
            .comment(Map.of(ROOT, "Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International"));

    DatasetsFrame DATASETS=new DatasetsFrame()
            .id(Data.DATA.resolve("/"))
            .isDefinedBy(Data.DATA.resolve("datasets/"))
            .title(map(entry(EN, "EC2U Dataset Catalog")))
            .alternative(map(entry(EN, "EC2U Datasets")))
            .description(map(entry(EN, "Datasets published on the EC2U Knowledge Hub.")))
            .publisher(EC2U)
            .rights(COPYRIGHT)
            .license(set(CCBYNCND40));


    static void main(final String... args) {
        exec(() -> service(store()).insert(array(CCBYNCND40, DATASETS)));
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    @Override
    default Datasets dataset() {
        return DATASETS;
    }

    @Override
    Set<Dataset> members();


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    final class Handler extends Delegator {

        public Handler() {

            delegate(new Driver().retrieve(new DatasetsFrame(true)

                    .members(stash(query(new DatasetFrame(true).members(null))
                            .where("issued", criterion().any(set()))
                    ))

            )));
        }

    }

}
