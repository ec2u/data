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

import com.metreeca.flow.handlers.Delegator;
import com.metreeca.flow.handlers.Router;
import com.metreeca.flow.handlers.Worker;
import com.metreeca.flow.jsonld.handlers.Driver;
import com.metreeca.flow.jsonld.handlers.Relator;
import com.metreeca.link.Shape;

import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.vocabulary.DCTERMS;
import org.eclipse.rdf4j.model.vocabulary.OWL;
import org.eclipse.rdf4j.model.vocabulary.RDFS;
import org.eclipse.rdf4j.model.vocabulary.SKOS;

import static com.metreeca.flow.Handler.handler;
import static com.metreeca.link.Constraint.any;
import static com.metreeca.link.Frame.*;
import static com.metreeca.link.Query.filter;
import static com.metreeca.link.Query.query;
import static com.metreeca.link.Shape.*;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.EC2U.create;
import static eu.ec2u.data.EC2U.item;
import static eu.ec2u.data.assets.Assets.Asset;
import static eu.ec2u.data.datasets.Datasets.Dataset;
import static eu.ec2u.data.resources.Resources.Resource;
import static eu.ec2u.data.resources.Resources.locales;

public final class Concepts extends Delegator {

    public static final IRI Context=item("/concepts/");

    public static final IRI Concept=item("Concept");
    public static final IRI ConceptScheme=item("ConceptScheme");


    public static Shape Concepts() {
        return Dataset(ConceptScheme());
    }


    public static Shape ConceptScheme() {
        return shape(SKOS.CONCEPT_SCHEME, Asset(),

                property(SKOS.HAS_TOP_CONCEPT, () -> multiple(Concept())),
                property("hasConcept", reverse(SKOS.IN_SCHEME), () -> multiple(Concept()))

        );
    }

    public static Shape Concept() {
        return shape(SKOS.CONCEPT, Resource(),

                property(SKOS.NOTATION, multiple(datatype(LITERAL))),

                property(SKOS.PREF_LABEL, required(text(locales()))),
                property(SKOS.ALT_LABEL, multiple(text(locales()))),
                property(SKOS.DEFINITION, optional(text(locales()))),

                property(SKOS.IN_SCHEME, required(ConceptScheme())),
                property(SKOS.TOP_CONCEPT_OF, optional(ConceptScheme())),

                property(SKOS.BROADER_TRANSITIVE, () -> multiple(Concept())),
                property(SKOS.NARROWER_TRANSITIVE, () -> multiple(Concept())),

                property(SKOS.BROADER, () -> multiple(Concept())),
                property(SKOS.NARROWER, () -> multiple(Concept())),
                property(SKOS.RELATED, () -> multiple(Concept())),
                property(SKOS.EXACT_MATCH, () -> multiple(Concept())),

                property(OWL.SAMEAS, optional(id()))

        );
    }


    public static void main(final String... args) {
        exec(() -> create(Context, Concepts.class, ConceptScheme(), Concept()));
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    public Concepts() {
        delegate(handler(

                new Driver(ConceptScheme()),

                new Router()

                        .path("/", handler(new Driver(Concepts()), new Worker()

                                .get(new Relator(frame(

                                        field(ID, iri()),
                                        field(RDFS.LABEL, literal("", ANY_LOCALE)),

                                        field(RDFS.MEMBER, query(

                                                frame(
                                                        field(ID, iri()),
                                                        field(RDFS.LABEL, literal("", ANY_LOCALE))
                                                ),

                                                filter(DCTERMS.ISSUED, any())


                                        ))

                                )))

                        ))

                        .path("/{scheme}", handler(new Driver(ConceptScheme()), new Worker()

                                .get(new Relator(frame(

                                        field(ID, iri()),
                                        field(RDFS.LABEL, literal("", ANY_LOCALE)),

                                        field(SKOS.HAS_TOP_CONCEPT, frame(
                                                field(ID, iri()),
                                                field(RDFS.LABEL, literal("", ANY_LOCALE))
                                        ))

                                )))

                        ))

                        .path("/{scheme}/*", handler(new Driver(Concept()), new Worker()

                                .get(new Relator(frame(

                                        field(ID, iri()),
                                        field(RDFS.LABEL, literal("", ANY_LOCALE))

                                )))

                        ))

        ));
    }

}