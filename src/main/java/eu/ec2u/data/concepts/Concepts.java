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
import com.metreeca.http.rdf4j.actions.Upload;
import com.metreeca.link.Shape;

import eu.ec2u.data.resources.Resources;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.vocabulary.DCTERMS;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.eclipse.rdf4j.model.vocabulary.RDFS;
import org.eclipse.rdf4j.model.vocabulary.SKOS;

import java.util.stream.Stream;

import static com.metreeca.http.Handler.handler;
import static com.metreeca.http.rdf.Values.pattern;
import static com.metreeca.http.rdf.formats.RDF.rdf;
import static com.metreeca.http.toolkits.Resources.resource;
import static com.metreeca.link.Frame.*;
import static com.metreeca.link.Query.filter;
import static com.metreeca.link.Query.query;
import static com.metreeca.link.Shape.integer;
import static com.metreeca.link.Shape.*;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.EC2U.Base;
import static eu.ec2u.data.EC2U.item;
import static eu.ec2u.data.datasets.Datasets.Dataset;
import static eu.ec2u.data.resources.Resources.Reference;
import static eu.ec2u.data.resources.Resources.Resource;
import static java.util.function.Predicate.not;
import static java.util.stream.Collectors.toList;

public final class Concepts extends Delegator {

    public static final IRI Context=item("/concepts/");

    public static final IRI Concept=item("Concept");
    public static final IRI ConceptScheme=item("ConceptScheme");


    public static Shape Concepts() {
        return Dataset(ConceptScheme());
    }

    public static Shape ConceptScheme() {
        return shape(ConceptScheme, Resource(), SKOSConceptScheme(),

                property(DCTERMS.EXTENT, required(integer()))

        );
    }

    public static Shape Concept() {
        return shape(Concept, Resource(), SKOSConcept(),

                property(DCTERMS.EXTENT, optional(integer()))

        );
    }


    public static Shape SKOSConceptScheme() {
        return shape(SKOS.CONCEPT_SCHEME, Reference(),

                property(SKOS.HAS_TOP_CONCEPT, () -> shape(multiple(), SKOSConcept())) // !!! concept.inScheme == this

        );
    }

    public static Shape SKOSConcept() {
        return shape(SKOS.CONCEPT, Reference(),

                property(SKOS.PREF_LABEL, required(Resources.localized())),
                property(SKOS.ALT_LABEL, multiple(Resources.localized())),
                property(SKOS.DEFINITION, optional(Resources.localized())),

                property(SKOS.IN_SCHEME, required(SKOSConceptScheme())),
                property(SKOS.TOP_CONCEPT_OF, optional(SKOSConceptScheme())), // !!! == inScheme

                property(SKOS.BROADER, () -> multiple(SKOSConcept())), // !!! broader.inScheme == inScheme
                property(SKOS.NARROWER, () -> multiple(SKOSConcept())), // !!! broader.inScheme == inScheme
                property(SKOS.RELATED, () -> multiple(SKOSConcept())), // !!! broader.inScheme == inScheme

                property(RDFS.ISDEFINEDBY, optional(id()))

        );
    }


    public static void main(final String... args) {
        exec(() -> Stream

                .of(

                        rdf(resource(Concepts.class, ".ttl"), Base),

                        rdf(resource("https://www.w3.org/2009/08/skos-reference/skos.rdf"), Base).stream()
                                .filter(not(pattern(null, RDFS.SUBPROPERTYOF, RDFS.LABEL)))
                                .collect(toList())

                )

                .forEach(new Upload()
                        .contexts(Context)
                        .clear(true)
                )
        );
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

                                                filter(RDF.TYPE, SKOS.CONCEPT_SCHEME) // !!! ConceptScheme

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