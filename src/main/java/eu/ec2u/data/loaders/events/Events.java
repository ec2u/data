/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

package eu.ec2u.data.loaders.events;

import com.metreeca.json.Frame;
import com.metreeca.rdf4j.actions.TupleQuery;
import com.metreeca.rdf4j.actions.Upload;
import com.metreeca.rdf4j.services.Graph;
import com.metreeca.rest.Xtream;
import com.metreeca.rest.services.Logger;

import eu.ec2u.data.Data;
import eu.ec2u.work.Validate;
import org.eclipse.rdf4j.model.Literal;
import org.eclipse.rdf4j.model.Value;

import java.time.Duration;
import java.time.Instant;

import static com.metreeca.json.Values.literal;
import static com.metreeca.json.Values.resource;
import static com.metreeca.rdf4j.services.Graph.graph;
import static com.metreeca.rest.Toolbox.service;
import static com.metreeca.rest.Xtream.task;
import static com.metreeca.rest.services.Logger.logger;
import static com.metreeca.rest.services.Logger.time;

import static eu.ec2u.data.loaders.Loaders.exec;
import static org.eclipse.rdf4j.query.QueryLanguage.SPARQL;

import static java.lang.String.format;

public final class Events implements Runnable {

	public static Instant synced(final Value publisher) {
		return Xtream

				.of("prefix ec2u: <terms#>\n"
						+"\n"
						+"prefix dct: <http://purl.org/dc/terms/>\n"
						+"prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\n"
						+"prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>\n"
						+"\n"
						+"select (max(?retrieved) as ?synced) where {\n"
						+"\n"
						+"\t?event a ec2u:Event;\n"
						+"\t\tdct:publisher ?publisher;\n"
						+"\t\tec2u:retrieved ?retrieved."
						+"\n"
						+"}"
				)

				.flatMap(new TupleQuery()
						.base(Data.Base)
						.binding("publisher", publisher)
						.dflt(Data.events)
				)

				.optMap(bindings -> literal(bindings.getValue("synced")))

				.map(Literal::temporalAccessorValue)
				.map(Instant::from)

				.findFirst()

				.orElseGet(() -> Instant.now().minus(Duration.ofDays(30)));
	}

	public static void upload(final Xtream<Frame> events) {
		events

				.optMap(new Validate(eu.ec2u.data.handlers.Events.Shape))

				.peek(frame -> service(graph()).update(task(connection ->
						resource(frame.focus()).ifPresent(resource ->
								connection.remove(resource, null, null, Data.events)
						)
				)))

				.flatMap(Frame::model)

				.batch(100_000)

				.forEach(new Upload()
						.contexts(Data.events)
				);
	}


	public static void main(final String... args) {
		exec(() -> new Events().run());
	}


	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	private final Graph graph=service(graph());
	private final Logger logger=service(logger());


	@Override public void run() {

		run(new EventsPaviaCity());
		run(new EventsTurkuCity());

		purge();
		collect();

	}


	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	private void run(final Runnable task) {
		try {

			time(task).apply(t -> logger.info(task.getClass(), format(
					"executedin <%,d> ms", t
			)));


		} catch ( final RuntimeException e ) {

			service(logger()).warning(task.getClass(), "failed", e);

		}
	}

	private void purge() {
		exec(() -> graph.update(task(connection -> connection

				.prepareUpdate(SPARQL, ""
						+"prefix : <terms#>\n"
						+"prefix schema: <https://schema.org/>\n"
						+"\n"
						+"delete {\n"
						+"\n"
						+"\t?event ?p ?o.\n"
						+"\t?s ?q ?event.\n"
						+"\n"
						+"} where {\n"
						+"\n"
						+"\t?event a :Event.\n"
						+"\n"
						+"\toptional { ?event schema:startDate ?start }\n"
						+"\toptional { ?event schema:endDate ?end }\n"
						+"\n"
						+"\tbind (coalesce(?end, ?start) as ?date)\n"
						+"\n"
						+"\tfilter (!bound(?date) || ?date < now() )\n"
						+"\n"
						+"}", Data.Base)

				.execute()

		)));
	}

	private void collect() {
		exec(() -> graph.update(task(connection -> {

			for (long size=0, next; (next=connection.size()) != size; size=next) {

				connection

						.prepareUpdate(""
								+"prefix void: <http://rdfs.org/ns/void#>\n"
								+"prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>\n"
								+"\n"
								+"delete { ?garbage ?p ?o } where {\n"
								+"\n"
								+"\t?garbage ?p ?o\n"
								+"\n"
								+"\tfilter not exists { ?s ?q ?garbage } # not referenced\n"
								+"\tfilter not exists { ?garbage a?/rdfs:subClassOf*/^void:rootResource [] }\n"
								+"\tfilter not exists { ?garbage a?/rdfs:subClassOf* rdfs:Resource }\n"
								+"\n"
								+"}"
						)

						.execute();

			}

		})));
	}

}
