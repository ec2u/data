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

import com.metreeca.mesh.meta.jsonld.Frame;
import com.metreeca.mesh.meta.jsonld.Namespace;
import com.metreeca.mesh.meta.jsonld.Virtual;

import eu.ec2u.data._resources.Catalog;
import eu.ec2u.data._resources.Resource;

import java.net.URI;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.json.formats.JSON.store;
import static com.metreeca.mesh.util.URIs.uri;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data._datasets.DatasetsFrame.Datasets;
import static eu.ec2u.data._datasets.DatasetsFrame.value;

@Frame
@Virtual
@Namespace("[ec2u]")
public interface Datasets extends Catalog<Resource> {

    URI ID=uri("/datasets/");


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    static void main(final String... args) {
        exec(() -> service(store()).update(value(Datasets()), true));
    }

}
