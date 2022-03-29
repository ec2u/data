/*
 * Copyright © 2022 EC2U Consortium. All rights reserved.
 */

package eu.ec2u.data.ports;

import com.metreeca.rdf4j.services.Graph;
import com.metreeca.rest.*;

import eu.ec2u.data.terms.EC2U;
import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.model.vocabulary.*;

import java.util.List;

import static com.metreeca.json.Frame.frame;
import static com.metreeca.json.Shape.required;
import static com.metreeca.json.Values.IRIType;
import static com.metreeca.json.Values.iri;
import static com.metreeca.json.shapes.Clazz.clazz;
import static com.metreeca.json.shapes.Datatype.datatype;
import static com.metreeca.json.shapes.Field.field;
import static com.metreeca.json.shapes.Guard.*;
import static com.metreeca.json.shapes.Localized.localized;
import static com.metreeca.rdf4j.services.Graph.configure;
import static com.metreeca.rdf4j.services.Graph.graph;
import static com.metreeca.rest.Handler.handler;
import static com.metreeca.rest.Response.OK;
import static com.metreeca.rest.Toolbox.service;
import static com.metreeca.rest.formats.JSONLDFormat.jsonld;
import static com.metreeca.rest.formats.JSONLDFormat.shape;
import static com.metreeca.rest.handlers.Router.router;
import static com.metreeca.rest.operators.Relator.relator;
import static com.metreeca.rest.wrappers.Driver.driver;

import static org.eclipse.rdf4j.common.iteration.Iterations.asList;
import static org.eclipse.rdf4j.query.QueryLanguage.SPARQL;

public final class Resources extends Handler.Base {

    public Resources() {
        delegate(driver(relate(

                filter(clazz(EC2U.Resource)),

                field(RDF.TYPE, repeatable(), datatype(IRIType)),

                field(RDFS.LABEL, required(), localized("en")),
                field(RDFS.COMMENT, optional(), localized("en")),

                field(EC2U.image, optional(), datatype(IRIType)),

                field(EC2U.university, optional(),
                        field(RDFS.LABEL, required(), localized("en"))
                )

        )).wrap(router()

                .get(handler(request -> !request.query().isEmpty(), relator(), driver(

                        field("universities", EC2U.University, optional(), datatype(XSD.INTEGER)),
                        field("events", EC2U.Event, optional(), datatype(XSD.INTEGER))

                ).wrap(new Virtual(

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

                ))))

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


        @Override public Response handle(final Request request) {
            return request.reply(response -> response.status(OK)
                    .set(shape(), request.get(shape()))
                    .body(jsonld(), frame(iri(request.item()), graph.<List<Statement>>query(connection ->
                            asList(configure(request,
                                    connection.prepareGraphQuery(SPARQL, query, request.base())
                            ).evaluate())
                    ))));
        }

    }
}