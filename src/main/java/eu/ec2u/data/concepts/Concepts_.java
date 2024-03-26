/*
 * Copyright © 2020-2024 EC2U Alliance
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

import com.metreeca.http.rdf4j.actions.Update;
import com.metreeca.http.rdf4j.actions.Upload;
import com.metreeca.link.Frame;

import eu.ec2u.data.EC2U;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.eclipse.rdf4j.model.vocabulary.RDFS;
import org.eclipse.rdf4j.model.vocabulary.SKOS;

import java.util.Optional;
import java.util.stream.Stream;

import static com.metreeca.http.rdf.Values.pattern;
import static com.metreeca.http.rdf.formats.RDF.rdf;
import static com.metreeca.http.toolkits.Resources.resource;
import static com.metreeca.http.toolkits.Resources.text;
import static com.metreeca.http.toolkits.Strings.lower;
import static com.metreeca.http.toolkits.Strings.title;
import static com.metreeca.link.Frame.*;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.EC2U.Base;
import static eu.ec2u.data.EC2U.item;
import static java.util.function.Predicate.not;
import static java.util.stream.Collectors.toList;

public final class Concepts_ implements Runnable {

    private static final IRI Context=iri(Concepts.Context, "/~");


    public static void main(final String... args) {
        exec(() -> new Concepts_().run());
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    public static Optional<Frame> concept(final IRI scheme, final String label, final String language) {
        return Optional.of(frame(

                field(ID, item(scheme, lower(label))),

                field(RDF.TYPE, SKOS.CONCEPT),
                field(SKOS.TOP_CONCEPT_OF, scheme),
                field(SKOS.PREF_LABEL, literal(title(label), language))

        ));
    }

    // public static Optional<Concept> concept(final IRI scheme, final String label, final String language) { // !!! URI
    //
    //     return Optional.of(with(new Concept(), concept -> {
    //
    //         final ConceptScheme conceptScheme=with(new ConceptScheme(), cs -> cs.setId(scheme.stringValue()));
    //         final Local<String> local=Local.local(language, title(label));
    //
    //         concept.setId(EC2U.item(scheme, lower(label)).stringValue()); // !!! string
    //
    //         concept.setLabel(local);
    //         concept.setPrefLabel(local);
    //
    //         concept.setInScheme(conceptScheme);
    //         concept.setTopConceptOf(conceptScheme);
    //
    //     }));
    //
    // }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    @Override public void run() {

        Stream

                .of(

                        rdf(resource(Concepts.class, ".ttl"), Base),

                        rdf(resource("https://www.w3.org/2009/08/skos-reference/skos.rdf"), Base).stream()
                                .filter(not(pattern(null, RDFS.SUBPROPERTYOF, RDFS.LABEL)))
                                .collect(toList())

                )

                .forEach(new Upload()
                        .contexts(Context)
                        .clear(true)
                );

        Stream

                .of(text(resource(Concepts.class, ".ul")))

                .forEach(new Update()
                        .base(Base)
                        .insert(Context)
                );
    }

}
