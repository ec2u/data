/*
 * Copyright © 2020 Metreeca srl. All rights reserved.
 */

package eu.ec2u.data.tasks;

import com.metreeca.json.Values;
import com.metreeca.rdf4j.services.Graph;
import com.metreeca.rest.services.Logger;

import eu.ec2u.data.Data;
import org.eclipse.rdf4j.model.IRI;

import java.util.Collection;
import java.util.Set;

import static com.metreeca.rdf4j.services.Graph.graph;
import static com.metreeca.rest.Toolbox.service;
import static com.metreeca.rest.Xtream.task;
import static com.metreeca.rest.services.Logger.logger;

import static eu.ec2u.data.tasks.Tasks.exec;
import static org.eclipse.rdf4j.query.QueryLanguage.SPARQL;

import static java.lang.String.format;
import static java.util.stream.Collectors.joining;


public final class Chores implements Runnable {

	private static Collection<IRI> locked=Set.of(
			Data.ontologies
	);


	public static void main(final String... args) {
		exec(() -> new Chores().run());
	}


	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	private final Graph graph=service(graph());
	private final Logger logger=service(logger());


	@Override public void run() {
		collect();
	}


	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	private void collect() {

		logger.info(this, "collecting garbage");

		exec(() -> graph.update(task(connection -> {

			for (long size=0, next; (next=connection.size()) != size; size=next) {

				connection

						.prepareUpdate(SPARQL, format(

								""
										+"prefix void: <http://rdfs.org/ns/void#>\n"
										+"prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>\n"
										+"\n"
										+"delete { ?garbage ?p ?o } where {\n"
										+"\n"
										+"\tgraph ?g { ?garbage ?p ?o }\n"
										+"\n"
										+"\tfilter (?g not in (%s)) # not in locked graph\n"
										+"\n"+
										"\tfilter not exists { ?s ?q ?garbage } # not referenced\n"
										+"\tfilter not exists { ?garbage "
										+"a?/rdfs:subClassOf*/^void:rootResource [] } # not a root resource\n"
										+"\n"
										+"}",

								locked.stream().map(Values::format).collect(joining(", "))

						), Data.Base)

						.execute();

			}

		})));
	}
}
