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

package eu.ec2u.data.datasets.taxonomies;

import com.metreeca.mesh.meta.jsonld.Class;
import com.metreeca.mesh.meta.jsonld.Frame;
import com.metreeca.mesh.meta.jsonld.Namespace;

import eu.ec2u.data.datasets.Dataset;
import eu.ec2u.data.vocabularies.skos.SKOSConceptScheme;

import java.util.Set;

import static eu.ec2u.data.datasets.taxonomies.Taxonomies.TAXONOMIES;

@Frame
@Class
@Namespace("[ec2u]")
public interface Taxonomy extends Dataset, SKOSConceptScheme {

    @Override
    default Taxonomies dataset() {
        return TAXONOMIES;
    }

    @Override
    Set<Topic> members();


    @Override
    Set<Topic> hasConcept();

    @Override
    Set<Topic> hasTopConcept();

}
