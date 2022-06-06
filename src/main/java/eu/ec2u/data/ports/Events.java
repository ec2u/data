/*
 * Copyright © 2021-2022 EC2U Consortium
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

import com.metreeca.http.Request;
import com.metreeca.http.Response;
import com.metreeca.http.handlers.Delegator;
import com.metreeca.http.handlers.Router;
import com.metreeca.json.codecs.JSON;
import com.metreeca.jsonld.codecs.JSONLD;
import com.metreeca.jsonld.handlers.Driver;
import com.metreeca.jsonld.handlers.Relator;
import com.metreeca.link.Shape;
import com.metreeca.link.Values;

import eu.ec2u.data.terms.EC2U;
import eu.ec2u.data.terms.Schema;
import org.eclipse.rdf4j.model.*;
import org.eclipse.rdf4j.model.vocabulary.DCTERMS;
import org.eclipse.rdf4j.model.vocabulary.RDF;

import java.time.Instant;
import java.util.List;
import java.util.function.Function;
import java.util.stream.Stream;

import javax.json.Json;
import javax.json.JsonArrayBuilder;

import static com.metreeca.core.Lambdas.guarded;
import static com.metreeca.http.Handler.handler;
import static com.metreeca.http.Locator.service;
import static com.metreeca.http.Response.OK;
import static com.metreeca.http.services.Logger.logger;
import static com.metreeca.jsonld.codecs.JSONLD.shape;
import static com.metreeca.link.Values.pattern;
import static com.metreeca.link.shapes.All.all;
import static com.metreeca.link.shapes.Clazz.clazz;
import static com.metreeca.link.shapes.Field.field;
import static com.metreeca.link.shapes.Guard.*;
import static com.metreeca.link.shapes.Range.range;
import static com.metreeca.rdf4j.services.Graph.graph;

import static org.eclipse.rdf4j.common.iteration.Iterations.asList;

import static java.lang.String.format;
import static java.time.format.DateTimeFormatter.ISO_ZONED_DATE_TIME;
import static java.util.Comparator.comparing;

public final class Events extends Delegator {

    public static Shape Event() {
        return relate(

                filter(clazz(EC2U.Event)),

                hidden(
                        field(RDF.TYPE, all(EC2U.Event), range(EC2U.Event, Schema.Event))
                ),

                EC2U.Resource(),
                Schema.Event()

        );
    }


    public Events() {
        delegate(handler(new Driver(Event()), new Router()

                .path("/", new Router()
                        .get(new Relator())
                )

                .path("/~", new Router()
                        .get(this::bulk)
                )

                .path("/*", new Router() // !!! remove
                        .get(this::bulk)
                )

                .path("/{id}", new Router()
                        .get(new Relator())
                )
        ));
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Response bulk(final Request request, final Function<Request, Response> forward) {

        final Shape shape=shape(request);

        final long offset=request.parameter(".offset")
                .map(guarded(Long::parseLong))
                .filter(v -> v >= 0)
                .orElse(0L);

        final long limit=request.parameter(".limit")
                .map(guarded(Long::parseLong))
                .filter(v -> v > 0) // 0 => no limit
                .orElse(Long.MAX_VALUE);

        final Instant fence=request.parameter(">modified")
                .or(() -> request.parameter(">updated")) // !!! remove
                .map(guarded(ISO_ZONED_DATE_TIME::parse))
                .map(Instant::from)
                .orElseGet(() -> Instant.ofEpochMilli(0));


        final List<Statement> context=service(graph()).query(connection -> asList(connection
                .getStatements(null, null, null, true, EC2U.events, EC2U.wikidata)
        ));


        final Stream<IRI> validated=context.stream()

                .filter(pattern(null, RDF.TYPE, EC2U.Event))

                .map(Statement::getSubject)
                .filter(IRI.class::isInstance)
                .map(IRI.class::cast)

                .filter(event -> context.stream()
                        .filter(pattern(event, DCTERMS.MODIFIED, null))
                        .findFirst()
                        .map(Statement::getObject)
                        .flatMap(Values::literal)
                        .map(Literal::temporalAccessorValue)
                        .map(Instant::from)
                        .map(fence::compareTo)
                        .map(v -> v <= 0)
                        .orElse(false)
                )

                .sorted(comparing(Value::stringValue))

                .skip(offset)
                .limit(limit)

                .filter(event -> shape.validate(event, context).fold(

                        trace -> {

                            service(logger()).warning(Events.class, format("%s %s", event, trace.toString()));

                            return false;
                        },

                        model -> true

                ));


        final JsonArrayBuilder events=Json.createArrayBuilder();

        validated
                .map(event -> JSONLD.encode(event, shape, EC2U.Keywords, context))
                .forEach(events::add);

        return request.reply(OK).body(new JSON(), Json.createObjectBuilder()
                .add("contains", events)
                .build()
        );

    }

}