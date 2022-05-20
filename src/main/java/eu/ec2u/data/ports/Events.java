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

import com.metreeca.json.Shape;
import com.metreeca.json.Values;
import com.metreeca.rest.*;
import com.metreeca.rest.formats.JSONLDFormat;

import eu.ec2u.data.terms.EC2U;
import eu.ec2u.data.terms.Schema;
import org.eclipse.rdf4j.model.*;
import org.eclipse.rdf4j.model.vocabulary.DCTERMS;
import org.eclipse.rdf4j.model.vocabulary.RDF;

import java.time.Instant;
import java.util.List;
import java.util.stream.Stream;

import javax.json.Json;
import javax.json.JsonArrayBuilder;

import static com.metreeca.core.Lambdas.guarded;
import static com.metreeca.json.Values.pattern;
import static com.metreeca.json.shapes.All.all;
import static com.metreeca.json.shapes.Clazz.clazz;
import static com.metreeca.json.shapes.Field.field;
import static com.metreeca.json.shapes.Guard.*;
import static com.metreeca.json.shapes.Range.range;
import static com.metreeca.rdf4j.services.Graph.graph;
import static com.metreeca.rest.Response.OK;
import static com.metreeca.rest.Toolbox.service;
import static com.metreeca.rest.formats.JSONFormat.json;
import static com.metreeca.rest.formats.JSONLDFormat.shape;
import static com.metreeca.rest.handlers.Router.router;
import static com.metreeca.rest.operators.Relator.relator;
import static com.metreeca.rest.services.Logger.logger;
import static com.metreeca.rest.wrappers.Driver.driver;

import static org.eclipse.rdf4j.common.iteration.Iterations.asList;

import static java.lang.String.format;
import static java.time.format.DateTimeFormatter.ISO_ZONED_DATE_TIME;
import static java.util.Comparator.comparing;

public final class Events extends Handler.Base {

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
		delegate(driver(Event()).wrap(router()

				.path("/", router()
						.get(relator())
				)

				.path("/*", router()
						.get(this::bulk)
				)

				.path("/{id}", router()
						.get(relator())
				)

		));
	}


	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	private Response bulk(final Request request) {

		final Shape shape=request.get(shape());

		final long offset=request.parameter(".offset")
				.map(guarded(Long::parseLong))
				.filter(v -> v >= 0)
				.orElse(0L);

		final long limit=request.parameter(".limit")
				.map(guarded(Long::parseLong))
				.filter(v -> v > 0) // 0 => no limit
				.orElse(Long.MAX_VALUE);

		final Instant fence=request.parameter(">updated")
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

				.filter(event -> JSONLDFormat.validate(event, shape, context).fold(

						trace -> {

							service(logger()).warning(Events.class, format("%s %s", event, trace.toString()));

							return false;
						},

						model -> true

				));


		final JsonArrayBuilder events=Json.createArrayBuilder();

		validated
				.map(event -> JSONLDFormat.encode(event, shape, EC2U.Keywords, context))
				.forEach(events::add);

		return request.reply(OK).body(json(), Json.createObjectBuilder()
				.add("contains", events)
				.build()
		);

	}

}