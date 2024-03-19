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
import com.metreeca.http.rdf4j.actions.Upload;
import com.metreeca.link.Shape;

import eu.ec2u.data.EC2U;
import eu.ec2u.data.concepts.Concepts;
import eu.ec2u.data.resources.Resources;
import eu.ec2u.data.things.Schema;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.vocabulary.DCTERMS;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.eclipse.rdf4j.model.vocabulary.RDFS;

import java.util.regex.Pattern;
import java.util.stream.Stream;

import static com.metreeca.http.Handler.handler;
import static com.metreeca.http.rdf.formats.RDF.rdf;
import static com.metreeca.http.toolkits.Resources.resource;
import static com.metreeca.link.Frame.*;
import static com.metreeca.link.Query.filter;
import static com.metreeca.link.Query.query;
import static com.metreeca.link.Shape.*;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.EC2U.Base;
import static eu.ec2u.data.EC2U.term;
import static eu.ec2u.data.concepts.Concepts.SKOSConcept;
import static eu.ec2u.data.datasets.Datasets.Dataset;
import static eu.ec2u.data.organizations.Organizations.OrgOrganization;
import static eu.ec2u.data.persons.Persons.Person;
import static eu.ec2u.data.resources.Resources.Resource;
import static eu.ec2u.data.resources.Resources.university;

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

                property(Schema.url, multiple(id())), // !!! datatype

                property(DCTERMS.IDENTIFIER, optional(string())),
                property(DCTERMS.LANGUAGE, multiple(string())),

                property(DCTERMS.TITLE, required(Resources.localized(), maxLength(100))),
                property(DCTERMS.DESCRIPTION, optional(Resources.localized(), maxLength(1000))),

                property(DCTERMS.ISSUED, optional(dateTime())),
                property(DCTERMS.MODIFIED, optional(dateTime())),
                property(DCTERMS.VALID, optional(string(), pattern(ValidPattern.pattern()))),

                property(DCTERMS.CREATOR, optional(Person())),
                property(DCTERMS.CONTRIBUTOR, multiple(Person())),
                property(DCTERMS.PUBLISHER, optional(OrgOrganization())), // !!! review/factor

                property(DCTERMS.LICENSE, optional(string())),
                property(DCTERMS.RIGHTS, optional(string())),

                property(DCTERMS.AUDIENCE, multiple(SKOSConcept())),
                property(DCTERMS.RELATION, () -> shape(multiple(Document())))

        );
    }


    public static void main(final String... args) {
        exec(() -> Stream

                .of(rdf(resource(Documents.class, ".ttl"), Base))

                .forEach(new Upload()
                        .contexts(Context)
                        .clear(true)
                )
        );
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

                                                field(university, iri()),
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

                                field(university, iri()),
                                field(DCTERMS.TYPE, iri())

                        )))

                ))
        );
    }

}