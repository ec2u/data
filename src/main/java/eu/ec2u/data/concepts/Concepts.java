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

import com.metreeca.http.handlers.Delegator;
import com.metreeca.http.rdf4j.actions.Update;
import com.metreeca.http.rdf4j.actions.Upload;
import com.metreeca.link.Shape;

import eu.ec2u.data._EC2U;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.impl.LinkedHashModel;
import org.eclipse.rdf4j.model.vocabulary.DCTERMS;
import org.eclipse.rdf4j.model.vocabulary.RDFS;
import org.eclipse.rdf4j.model.vocabulary.SKOS;

import java.util.stream.Stream;

import static com.metreeca.http.Handler.handler;
import static com.metreeca.http.rdf.Values.iri;
import static com.metreeca.http.rdf.formats.RDF.rdf;
import static com.metreeca.http.toolkits.Resources.text;
import static com.metreeca.link.Shape.*;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data._EC2U.item;
import static eu.ec2u.data.resources.Resource.Resource;
import static eu.ec2u.data.resources.Resources.Reference;

public final class Concepts extends Delegator {

    public static final IRI Context=item("/concepts/");

    public static final IRI Concept=item("Concept");
    public static final IRI ConceptScheme=item("ConceptScheme");


    public static Shape Concept() {
        return shape(clazz(Concept), Resource(), SKOSConcept(),

                property(DCTERMS.EXTENT, optional(), integer())

        );
    }

    public static Shape ConceptScheme() {
        return shape(clazz(ConceptScheme), Resource(), SKOSConceptScheme());
    }


    public static Shape SKOSConcept() {
        return shape(clazz(SKOS.CONCEPT), Reference(),

                property(SKOS.PREF_LABEL, required(), local()),
                property(SKOS.ALT_LABEL, multiple(), local()),
                property(SKOS.DEFINITION, optional(), local()),

                property(SKOS.IN_SCHEME, required(), SKOSConceptScheme()),
                property(SKOS.TOP_CONCEPT_OF, optional(), SKOSConceptScheme()), // !!! == inScheme

                property(SKOS.BROADER, () -> shape(multiple(), SKOSConcept())), // !!! broader.inScheme == inScheme
                property(SKOS.NARROWER, () -> shape(multiple(), SKOSConcept())), // !!! broader.inScheme == inScheme
                property(SKOS.RELATED, () -> shape(multiple(), SKOSConcept())), // !!! broader.inScheme == inScheme

                property(RDFS.ISDEFINEDBY, optional(), reference())
        );
    }

    public static Shape SKOSConceptScheme() {
        return shape(clazz(SKOS.CONCEPT), Reference(),

                property(SKOS.HAS_TOP_CONCEPT, () -> shape(multiple(), SKOSConcept())) // !!! concept.inScheme == this

        );
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    public Concepts() {
        delegate(handler(

                //                new Driver(ConceptScheme()),
                //
                //                new Router()
                //
                //                        .path("/", new Worker()
                //                                .get(new Relator())
                //                        )
                //
                //                        .path("/{scheme}", new Worker()
                //                                .get(new Relator())
                //                        )
                //
                //                        .path("/{scheme}/*", handler(
                //
                //                                new Driver(Concept()),
                //
                //                                new Worker()
                //                                        .get(new Relator())
                //
                //                        ))

        ));
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    public static final class Loader implements Runnable {

        public static void main(final String... args) {
            exec(() -> new Loader().run());
        }

        @Override public void run() {
            Stream

                    .of(

                            rdf(Concepts.class, ".ttl", _EC2U.Base),

                            skos(rdf("https://www.w3.org/2009/08/skos-reference/skos.rdf"))

                    )

                    .forEach(new Upload()
                            .contexts(Context)
                            .clear(true)
                    );
        }


        private Model skos(final Model skos) {

            final Model patched=new LinkedHashModel(skos);

            patched.remove(null, RDFS.SUBPROPERTYOF, RDFS.LABEL);

            return patched;
        }

    }

    public static final class Updater implements Runnable {

        public static void main(final String... args) {
            exec(() -> new Updater().run());
        }

        @Override public void run() {
            Stream

                    .of(text(Concepts.class, ".ul"))

                    .forEach(new Update()
                            .base(_EC2U.Base)
                            .insert(iri(Context, "/~"))
                            .clear(true)
                    );
        }

    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

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

}