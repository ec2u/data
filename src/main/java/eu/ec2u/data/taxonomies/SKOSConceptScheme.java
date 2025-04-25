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

package eu.ec2u.data.taxonomies;

import com.metreeca.mesh.meta.jsonld.Class;
import com.metreeca.mesh.meta.jsonld.Foreign;
import com.metreeca.mesh.meta.jsonld.Hidden;
import com.metreeca.mesh.meta.jsonld.Reverse;

import java.util.Set;

@Class("skos:ConceptScheme")
@SuppressWarnings("NonBooleanMethodNameMayNotStartWithQuestion")
public interface SKOSConceptScheme<S extends SKOSConceptScheme<S, C>, C extends SKOSConcept<S, C>> extends SKOS {

    @Foreign
    @Reverse("skos:topConceptOf")
    Set<C> hasTopConcept();

    @Hidden
    @Foreign
    @Reverse("skos:inScheme")
    Set<C> hasConcept();

}
