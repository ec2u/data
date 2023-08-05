/*
 * Copyright © 2020-2023 EC2U Alliance
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

import com.metreeca.link.Local;
import com.metreeca.link.jsonld.Namespace;
import com.metreeca.link.jsonld.Property;
import com.metreeca.link.jsonld.Type;
import com.metreeca.link.shacl.Required;

import eu.ec2u.data.EC2U;
import eu.ec2u.data.resources.Resource;
import lombok.Getter;
import lombok.Setter;
import org.eclipse.rdf4j.model.IRI;

import java.net.URI;
import java.util.Optional;
import java.util.Set;

import static com.metreeca.http.toolkits.Strings.lower;
import static com.metreeca.http.toolkits.Strings.title;
import static com.metreeca.link.Frame.with;

@Type
@Namespace("skos:")
@Getter
@Setter
public final class Concept extends Resource {

    public static Optional<Concept> concept(final IRI scheme, final String label, final String language) { // !!! URI

        return Optional.of(with(new Concept(), concept -> {

            final ConceptScheme conceptScheme=with(new ConceptScheme(), cs -> cs.setId(scheme.stringValue()));
            final Local<String> local=Local.local(language, title(label));

            concept.setId(EC2U.item(scheme, lower(label)).stringValue()); // !!! string

            concept.setLabel(local);
            concept.setPrefLabel(local);

            concept.setInScheme(conceptScheme);
            concept.setTopConceptOf(conceptScheme);

        }));

    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    @Required
    private Local<String> prefLabel;

    private Local<Set<String>> altLabel;

    private Local<String> definition;

    @Required
    private ConceptScheme inScheme;

    private ConceptScheme topConceptOf; // !!! == inScheme


    private Set<Concept> broader; // !!! broader.inScheme == inScheme

    private Set<Concept> narrower; // !!! broader.inScheme == inScheme

    private Set<Concept> related; // !!! broader.inScheme == inScheme


    @Property("rdfs:")
    private URI isDefinedBy;


    @Type
    @Namespace("skos:")
    public static final class ConceptScheme extends Resource {

    }

}
