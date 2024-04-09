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

package eu.ec2u.data.documents;

import com.metreeca.http.handlers.Delegator;
import com.metreeca.http.handlers.Router;
import com.metreeca.http.handlers.Worker;
import com.metreeca.http.jsonld.handlers.Driver;
import com.metreeca.http.jsonld.handlers.Relator;
import com.metreeca.link.Shape;

import eu.ec2u.data.EC2U;
import eu.ec2u.data.concepts.Concepts;
import eu.ec2u.data.things.Schema;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.vocabulary.DCTERMS;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.eclipse.rdf4j.model.vocabulary.RDFS;

import java.util.regex.Pattern;

import static com.metreeca.http.Handler.handler;
import static com.metreeca.link.Frame.*;
import static com.metreeca.link.Query.filter;
import static com.metreeca.link.Query.query;
import static com.metreeca.link.Shape.*;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.EC2U.create;
import static eu.ec2u.data.EC2U.term;
import static eu.ec2u.data.concepts.Concepts.Concept;
import static eu.ec2u.data.datasets.Datasets.Dataset;
import static eu.ec2u.data.organizations.Organizations.Organization;
import static eu.ec2u.data.persons.Persons.Person;
import static eu.ec2u.data.resources.Resources.*;

public final class Documents extends Delegator {

    public static final IRI Context=EC2U.item("/documents/");

    public static final IRI Types=iri(Concepts.Context, "/document-types");
    public static final IRI Topics=iri(Concepts.Context, "/document-topics");
    public static final IRI Audiences=iri(Concepts.Context, "/document-audiences");


    public static final IRI Document=term("Document");


    public static final Pattern ValidPattern=Pattern.compile("\\d{4}(?:/\\d{4})?");


    public static Shape Documents() {
        return Dataset(Document());
    }

    public static Shape Document() {
        return shape(Document, Resource(),

                property(Schema.url, multiple(id())),

                property(DCTERMS.IDENTIFIER, optional(string())),
                property(DCTERMS.LANGUAGE, multiple(string())),

                property(DCTERMS.TITLE, required(localized(), maxLength(1_000))),
                property(DCTERMS.DESCRIPTION, optional(localized(), maxLength(10_000))),

                property(DCTERMS.ISSUED, optional(date())),
                property(DCTERMS.MODIFIED, optional(date())),
                property(DCTERMS.VALID, optional(string(), pattern(ValidPattern.pattern()))),

                property(DCTERMS.CREATOR, optional(Person())),
                property(DCTERMS.CONTRIBUTOR, multiple(Person())),
                property(DCTERMS.PUBLISHER, optional(Organization())),

                property(DCTERMS.LICENSE, optional(string())),
                property(DCTERMS.RIGHTS, optional(string())),

                property(DCTERMS.TYPE, multiple(Concept())),
                property(DCTERMS.SUBJECT, multiple(Concept())),
                property(DCTERMS.AUDIENCE, multiple(Concept())),

                property(DCTERMS.RELATION, () -> shape(multiple(Document())))

        );
    }


    public static void main(final String... args) {
        exec(() -> create(Context, Documents.class));
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    public Documents() {
        delegate(new Router()

                .path("/", handler(new Driver(Documents()), new Worker()

                        .get(new Relator(frame(

                                field(ID, iri()),
                                field(RDFS.LABEL, literal("", WILDCARD)),

                                field(RDFS.MEMBER, query(

                                        frame(

                                                field(ID, iri()),
                                                field(RDFS.LABEL, literal("", WILDCARD)),

                                                field(partner, iri()),
                                                field(DCTERMS.TYPE, iri())

                                        ),

                                        filter(RDF.TYPE, Document)

                                ))

                        )))

                ))

                .path("/{code}", handler(new Driver(Document()), new Worker()

                        .get(new Relator(frame(

                                field(ID, iri()),

                                field(RDFS.LABEL, literal("", WILDCARD)),

                                field(partner, iri()),
                                field(DCTERMS.TYPE, iri())

                        )))

                ))
        );
    }

}