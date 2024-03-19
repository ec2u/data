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

package eu.ec2u.data.offers.programs;

import com.metreeca.http.handlers.Delegator;
import com.metreeca.http.handlers.Router;
import com.metreeca.http.handlers.Worker;
import com.metreeca.http.jsonld.handlers.Driver;
import com.metreeca.http.jsonld.handlers.Relator;
import com.metreeca.link.Shape;

import eu.ec2u.data.things.Schema;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.eclipse.rdf4j.model.vocabulary.RDFS;

import static com.metreeca.http.Handler.handler;
import static com.metreeca.link.Frame.*;
import static com.metreeca.link.Query.filter;
import static com.metreeca.link.Query.query;

import static eu.ec2u.data.datasets.Datasets.Dataset;
import static eu.ec2u.data.offers.Offers.Program;
import static eu.ec2u.data.resources.Resources.university;

public final class Programs extends Delegator {

    public static Shape Programs() { return Dataset(Program()); }


    public static void main(final String... args) { }


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

                                                field(university, iri()),
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

                                field(university, iri()),
                                field(Schema.programType, iri())

                        )))

                ))

        );

    }

}
