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

import com.metreeca.link.Frame;

import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.eclipse.rdf4j.model.vocabulary.SKOS;

import java.util.Optional;

import static com.metreeca.flow.toolkits.Strings.lower;
import static com.metreeca.flow.toolkits.Strings.title;
import static com.metreeca.link.Frame.*;

import static eu.ec2u.data.EC2U.item;

public final class Concepts_ {

    public static Optional<Frame> concept(final IRI scheme, final String label, final String language) {
        return Optional.of(frame(

                field(ID, item(scheme, lower(label))),

                field(RDF.TYPE, SKOS.CONCEPT),
                field(SKOS.TOP_CONCEPT_OF, scheme),
                field(SKOS.PREF_LABEL, literal(title(label), language))

        ));
    }

    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Concepts_() { }

}
