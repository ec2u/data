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
import com.metreeca.http.handlers.Router;
import com.metreeca.http.handlers.Worker;
import com.metreeca.http.jsonld.handlers.Driver;
import com.metreeca.http.jsonld.handlers.Relator;
import com.metreeca.link.Shape;

import eu.ec2u.data.datasets.Datasets;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.eclipse.rdf4j.model.vocabulary.RDFS;
import org.eclipse.rdf4j.model.vocabulary.SKOS;
import org.eclipse.rdf4j.model.vocabulary.VOID;

import static com.metreeca.http.Handler.handler;
import static com.metreeca.link.Frame.*;
import static com.metreeca.link.Query.filter;
import static com.metreeca.link.Query.query;
import static com.metreeca.link.Shape.integer;
import static com.metreeca.link.Shape.*;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.Data.txn;
import static eu.ec2u.data.EC2U.item;
import static eu.ec2u.data.datasets.Datasets.Dataset;
import static eu.ec2u.data.resources.Resources.Entry;
import static eu.ec2u.data.resources.Resources.localized;

public final class Concepts extends Delegator {

    public static final IRI Context=item("/concepts/");

    public static final IRI Concept=item("Concept");
    public static final IRI ConceptScheme=item("ConceptScheme");


    public static Shape Concepts() {
        return Dataset(SKOSConceptScheme());
    }



    public static Shape SKOSConceptScheme() {
        return shape(SKOS.CONCEPT_SCHEME, Entry(),

                property(VOID.ENTITIES, required(integer())),

                property(SKOS.HAS_TOP_CONCEPT, () -> multiple(SKOSConcept()))

        );
    }

    public static Shape SKOSConcept() {
        return shape(SKOS.CONCEPT, Entry(),

                property(SKOS.PREF_LABEL, required(localized())),
                property(SKOS.ALT_LABEL, multiple(localized())),
                property(SKOS.DEFINITION, optional(localized())),

                property(SKOS.IN_SCHEME, required(SKOSConceptScheme())),
                property(SKOS.TOP_CONCEPT_OF, optional(SKOSConceptScheme())),

                property(SKOS.BROADER_TRANSITIVE, () -> multiple(SKOSConcept())),
                property(SKOS.NARROWER_TRANSITIVE, () -> multiple(SKOSConcept())),

                property(SKOS.BROADER, () -> multiple(SKOSConcept())),
                property(SKOS.NARROWER, () -> multiple(SKOSConcept())),
                property(SKOS.RELATED, () -> multiple(SKOSConcept()))

        );
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    public Concepts() {
        delegate(handler(

                new Driver(SKOSConceptScheme()),

                new Router()

                        .path("/", handler(new Driver(Concepts()), new Worker()

                                .get(new Relator(frame(

                                        field(ID, iri()),
                                        field(RDFS.LABEL, literal("", WILDCARD)),

                                        field(RDFS.MEMBER, query(

                                                frame(
                                                        field(ID, iri()),
                                                        field(RDFS.LABEL, literal("", WILDCARD))
                                                ),

                                                filter(RDF.TYPE, SKOS.CONCEPT_SCHEME)

                                        ))
                                )))

                        ))

                        .path("/{scheme}", handler(new Driver(SKOSConceptScheme()), new Worker()

                                .get(new Relator(frame(

                                        field(ID, iri()),
                                        field(RDFS.LABEL, literal("", WILDCARD)),

                                        field(SKOS.HAS_TOP_CONCEPT, frame(
                                                field(ID, iri()),
                                                field(RDFS.LABEL, literal("", WILDCARD))
                                        ))

                                )))

                        ))

                        .path("/{scheme}/*", handler(new Driver(SKOSConcept()), new Worker()

                                .get(new Relator(frame(

                                        field(ID, iri()),
                                        field(RDFS.LABEL, literal("", WILDCARD))

                                )))

                        ))

        ));
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    public static void main(final String... args) {
        exec(Concepts::create);
    }


    public static void create() {
        txn(() -> {

            Datasets.create(Concepts.class, Context);

            update();

        });
    }

    public static void update() {
        txn(() -> {

            Datasets.update(Concepts.class, Context);

            Datasets.update();

        });
    }

}