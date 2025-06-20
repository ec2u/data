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

package eu.ec2u.data.vocabularies.skos;

import com.metreeca.mesh.meta.jsonld.*;
import com.metreeca.mesh.meta.jsonld.Class;
import com.metreeca.mesh.meta.shacl.Required;

import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Frame
@Class("skos:Concept")
public interface SKOSConcept extends SKOS {

    String notation(); // ;( should be typed as per SKOS best practices


    @Required
    Map<Locale, String> prefLabel();

    Map<Locale, Set<String>> altLabel();

    Map<Locale, Set<String>> hiddenLabel();

    Map<Locale, String> definition();


    @Required
    SKOSConceptScheme inScheme();

    @Forward
    @Reverse("skos:hasTopConcept")
    SKOSConceptScheme topConceptOf();


    @Forward
    @Reverse("skos:narrower")
    Set<? extends SKOSConcept> broader();

    Set<? extends SKOSConcept> broaderTransitive();


    @Foreign
    Set<? extends SKOSConcept> narrower();

    @Forward
    @Reverse
    Set<? extends SKOSConcept> related();

    @Forward
    @Reverse
    Set<? extends SKOSConcept> exactMatch();


}
