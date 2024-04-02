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

package eu.ec2u.data.offerings.programs;

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
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.eclipse.rdf4j.model.vocabulary.RDFS;

import static com.metreeca.http.Handler.handler;
import static com.metreeca.http.rdf.Values.iri;
import static com.metreeca.link.Frame.*;
import static com.metreeca.link.Query.filter;
import static com.metreeca.link.Query.query;
import static com.metreeca.link.Shape.shape;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.EC2U.item;
import static eu.ec2u.data.EC2U.term;
import static eu.ec2u.data.datasets.Datasets.Dataset;
import static eu.ec2u.data.resources.Resources.Resource;
import static eu.ec2u.data.resources.Resources.owner;

public final class Programs extends Delegator {

    public static final IRI Context=item("/programs/");
    public static final IRI Scheme=iri(Concepts.Context, "/program-topics");

    public static final IRI Program=term("Program");


    public static Shape Programs() { return Dataset(Program()); }

    public static Shape Program() {
        return shape(Program, Resource(), Schema.EducationalOccupationalProgram());
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    public Programs() {
        delegate(new Router()

                .path("/", handler(new Driver(Programs()), new Worker()

                        .get(new Relator(frame(

                                field(ID, iri()),
                                field(RDFS.LABEL, literal("", WILDCARD)),

                                field(RDFS.MEMBER, query(

                                        frame(

                                                field(ID, iri()),
                                                field(RDFS.LABEL, literal("", WILDCARD)),

                                                field(owner, iri()),
                                                field(Schema.programType, iri())

                                        ),

                                        filter(RDF.TYPE, Program)

                                ))

                        )))

                ))

                .path("/{code}", handler(new Driver(Program()), new Worker()

                        .get(new Relator(frame(

                                field(ID, iri()),
                                field(RDFS.LABEL, literal("", WILDCARD)),

                                field(owner, iri()),
                                field(Schema.programType, iri())

                        )))

                ))

        );

    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    public static void main(final String... args) {
        exec(Programs::create);
    }


    public static void create() {
        EC2U.create(Context, Programs.class);
    }

}
