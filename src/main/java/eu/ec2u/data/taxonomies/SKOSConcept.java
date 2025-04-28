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
import com.metreeca.mesh.meta.jsonld.Forward;
import com.metreeca.mesh.meta.jsonld.Reverse;
import com.metreeca.mesh.meta.shacl.Required;

import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Stream;

import static com.metreeca.mesh.util.Collections.set;

@Class("skos:Concept")
public interface SKOSConcept<S extends SKOSConceptScheme<S, C>, C extends SKOSConcept<S, C>> extends SKOS {

    String notation(); // ;( should be typed as per SKOS best practices


    @Required
    Map<Locale, String> prefLabel();

    Map<Locale, Set<String>> altLabel();

    Map<Locale, Set<String>> hiddenLabel();

    Map<Locale, String> definition();


    @Required
    S inScheme();

    @Forward
    @Reverse("skos:hasTopConcept")
    S topConceptOf();


    @Forward
    @Reverse("skos:narrower")
    Set<C> broader();

    default Set<C> broaderTransitive() {
        return set(Stream.concat(
                broader().stream(),
                broader().stream().flatMap(c -> c.broaderTransitive().stream())
        ));
    }


    @Foreign
    Set<C> narrower();

    @Forward
    @Reverse
    Set<C> related();

    @Forward
    @Reverse
    Set<C> exactMatch();

}
