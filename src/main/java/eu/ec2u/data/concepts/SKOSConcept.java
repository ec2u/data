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

package eu.ec2u.data.concepts;

import com.metreeca.mesh.meta.jsonld.Class;
import com.metreeca.mesh.meta.jsonld.Foreign;
import com.metreeca.mesh.meta.jsonld.Frame;
import com.metreeca.mesh.meta.owl.Inverse;
import com.metreeca.mesh.meta.owl.Symmetric;
import com.metreeca.mesh.meta.shacl.Required;

import eu.ec2u.data.resources.Reference;

import java.net.URI;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Frame
@Class("skos:Concept")
public interface SKOSConcept extends SKOS {

    @Override
    default Map<Locale, String> label() {
        return Reference.label(prefLabel());
    }

    @Override
    default Map<Locale, String> comment() {
        return Reference.comment(definition());
    }


    @Required
    Map<Locale, String> prefLabel();

    Map<Locale, Set<String>> altLabel();

    Map<Locale, Set<String>> hiddenLabel();

    Map<Locale, String> definition();

    Map<URI, String> notation();


    @Required
    SKOSConceptScheme inScheme();

    @Inverse("skos:hasTopConcept")
    SKOSConceptScheme topConceptOf();


    @Foreign
    Set<SKOSConcept> narrower();

    @Inverse("skos:narrower")
    Set<SKOSConcept> broader();

    @Symmetric
    Set<SKOSConcept> related();

    @Symmetric
    Set<SKOSConcept> exactMatch();

}
