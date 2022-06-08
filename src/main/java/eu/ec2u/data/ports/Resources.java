/*
 * Copyright © 2020-2022 EC2U Alliance
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

package eu.ec2u.data.ports;

import com.metreeca.http.*;
import com.metreeca.http.handlers.Delegator;
import com.metreeca.http.handlers.Router;
import com.metreeca.jsonld.codecs.JSONLD;
import com.metreeca.jsonld.handlers.Driver;
import com.metreeca.jsonld.handlers.Relator;
import com.metreeca.rdf4j.services.Graph;

import eu.ec2u.data.terms.EC2U;
import org.eclipse.rdf4j.model.vocabulary.*;

import java.util.function.Function;

import static com.metreeca.http.Handler.handler;
import static com.metreeca.http.Locator.service;
import static com.metreeca.http.Response.OK;
import static com.metreeca.jsonld.codecs.JSONLD.shape;
import static com.metreeca.link.Frame.frame;
import static com.metreeca.link.Shape.*;
import static com.metreeca.link.Values.IRIType;
import static com.metreeca.link.Values.iri;
import static com.metreeca.link.shapes.Clazz.clazz;
import static com.metreeca.link.shapes.Datatype.datatype;
import static com.metreeca.link.shapes.Field.field;
import static com.metreeca.link.shapes.Guard.filter;
import static com.metreeca.link.shapes.Guard.relate;
import static com.metreeca.link.shapes.Localized.localized;
import static com.metreeca.rdf4j.services.Graph.configure;
import static com.metreeca.rdf4j.services.Graph.graph;

import static org.eclipse.rdf4j.common.iteration.Iterations.asList;
import static org.eclipse.rdf4j.query.QueryLanguage.SPARQL;

public final class Resources extends Delegator {

    public Resources() {
        delegate(handler(

                new Driver(relate(

                        filter(clazz(EC2U.Resource)),

                        field(RDF.TYPE, repeatable(), datatype(IRIType)),

                        field(RDFS.LABEL, required(), localized("en")),
                        field(RDFS.COMMENT, optional(), localized("en")),

                        field(EC2U.image, optional(), datatype(IRIType)),

                        field(EC2U.university, optional(),
                                field(RDFS.LABEL, required(), localized("en"))
                        )

                )),

                new Router()

                        .get(handler(request -> !request.query().isEmpty(), new Relator(), handler(

                                        new Driver(

                                                field("universities", EC2U.University, optional(),
                                                        datatype(XSD.INTEGER)),
                                                field("events", EC2U.Event, optional(), datatype(XSD.INTEGER))

                                        ),

                                        new Virtual(

                                                "prefix : </terms/>\n"
                                                        +"\n"
                                                        +"construct { $this ?t ?c } where {\n"
                                                        +"\n"
                                                        +"select ?t (count(distinct ?r) as ?c) {\n"
                                                        +"\n"
                                                        +"\t\tvalues ?t { :University :Event }\n"
                                                        +"\n"
                                                        +"\t\t?r a ?t\n"
                                                        +"\n"
                                                        +"\t} group by ?t\n"
                                                        +"\n"
                                                        +"}"

                                        )
                                ))
                        )

        ));
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private static final class Virtual implements Handler {

        private final String query;

        private final Graph graph=service(graph());


        public Virtual(final String query) {

            if ( query == null ) {
                throw new NullPointerException("null query");
            }

            this.query=query;
        }


        @Override public Response handle(final Request request, final Function<Request, Response> forward) {
            return request.reply(OK)
                    .map(response -> shape(response, shape(request)))
                    .body(new JSONLD(), frame(iri(request.item()), graph.query(connection ->
                            asList(configure(request,
                                    connection.prepareGraphQuery(SPARQL, query, request.base())
                            ).evaluate())
                    )));
        }

    }
}