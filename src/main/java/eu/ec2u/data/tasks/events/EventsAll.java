/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

package eu.ec2u.data.tasks.events;

import com.metreeca.json.Frame;
import com.metreeca.rdf4j.actions.TupleQuery;
import com.metreeca.rdf4j.services.Graph;
import com.metreeca.rest.Xtream;
import com.metreeca.rest.services.Logger;

import eu.ec2u.data.Data;
import eu.ec2u.data.ports.Events;
import eu.ec2u.work.Validate;
import org.eclipse.rdf4j.model.*;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

import static com.metreeca.json.Values.literal;
import static com.metreeca.rdf4j.services.Graph.graph;
import static com.metreeca.rest.Toolbox.service;
import static com.metreeca.rest.Xtream.task;
import static com.metreeca.rest.services.Logger.logger;
import static com.metreeca.rest.services.Logger.time;

import static eu.ec2u.data.tasks.Loaders.exec;
import static org.eclipse.rdf4j.query.QueryLanguage.SPARQL;

import static java.lang.String.format;

public final class EventsAll implements Runnable {

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

				.optMap(new Validate(Events.Shape))

				.batch(1000)

				.forEach(batch -> {

					final List<Resource> subjects=batch.stream()
							.map(Frame::focus)
							.filter(Resource.class::isInstance)
							.map(Resource.class::cast)
							.collect(Collectors.toList());

					final List<Statement> statements=batch.stream()
							.flatMap(Frame::model)
							.collect(Collectors.toList());

					service(graph()).update(task(connection -> {

						subjects.forEach(subject ->
								connection.remove(subject, null, null, Data.events)
						);

						connection.add(statements, Data.events);

					}));

				});
	}


	public static void main(final String... args) {
		exec(() -> new EventsAll().run());
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

		logger.info(this, "removing stale events");

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

		logger.info(this, "collecting garbage");

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
