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

import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.eclipse.rdf4j.model.vocabulary.RDFS;
import org.eclipse.rdf4j.model.vocabulary.SKOS;

import static com.metreeca.http.Handler.handler;
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
import static eu.ec2u.data.resources.Resources.localized;

public final class Concepts extends Delegator {

    public static final IRI Context=item("/concepts/");

    public static final IRI Concept=item("Concept");
    public static final IRI ConceptScheme=item("ConceptScheme");


    public static Shape Concepts() {
        return Dataset(ConceptScheme());
    }


    public static Shape ConceptScheme() {
        return shape(SKOS.CONCEPT_SCHEME, Asset(),

                property(SKOS.HAS_TOP_CONCEPT, () -> multiple(Concept()))

        );
    }

    public static Shape Concept() {
        return shape(SKOS.CONCEPT, Resource(),

                property(SKOS.PREF_LABEL, required(localized())),
                property(SKOS.ALT_LABEL, multiple(localized())),
                property(SKOS.DEFINITION, optional(localized())),

                property(SKOS.IN_SCHEME, required(ConceptScheme())),
                property(SKOS.TOP_CONCEPT_OF, optional(ConceptScheme())),

                property(SKOS.BROADER_TRANSITIVE, () -> multiple(Concept())),
                property(SKOS.NARROWER_TRANSITIVE, () -> multiple(Concept())),

                property(SKOS.BROADER, () -> multiple(Concept())),
                property(SKOS.NARROWER, () -> multiple(Concept())),
                property(SKOS.RELATED, () -> multiple(Concept())),
                property(SKOS.EXACT_MATCH, () -> multiple(Concept()))

        );
    }


    public static void main(final String... args) {
        exec(() -> create(Context, Concepts.class, ConceptScheme(), Concept()));
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    public Concepts() {
        delegate(handler(

                new Driver(ConceptScheme()),

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

                        .path("/{scheme}", handler(new Driver(ConceptScheme()), new Worker()

                                .get(new Relator(frame(

                                        field(ID, iri()),
                                        field(RDFS.LABEL, literal("", WILDCARD)),

                                        field(SKOS.HAS_TOP_CONCEPT, frame(
                                                field(ID, iri()),
                                                field(RDFS.LABEL, literal("", WILDCARD))
                                        ))

                                )))

                        ))

                        .path("/{scheme}/*", handler(new Driver(Concept()), new Worker()

                                .get(new Relator(frame(

                                        field(ID, iri()),
                                        field(RDFS.LABEL, literal("", WILDCARD))

                                )))

                        ))

        ));
    }

}