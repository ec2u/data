/***********************************************************************************************************************
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
 **********************************************************************************************************************/

package eu.ec2u.data.tasks.events;

import com.metreeca.rdf4j.actions.TupleQuery;
import com.metreeca.rdf4j.services.Graph;
import com.metreeca.rest.Xtream;
import com.metreeca.rest.services.Logger;

import eu.ec2u.data.terms.EC2U;
import org.eclipse.rdf4j.model.Literal;
import org.eclipse.rdf4j.model.Value;

import java.time.Duration;
import java.time.Instant;

import static com.metreeca.core.Lambdas.task;
import static com.metreeca.json.Values.literal;
import static com.metreeca.rdf4j.services.Graph.graph;
import static com.metreeca.rest.Toolbox.service;
import static com.metreeca.rest.services.Logger.logger;

import static eu.ec2u.data.tasks.Tasks.exec;
import static org.eclipse.rdf4j.query.QueryLanguage.SPARQL;

public final class Events implements Runnable {

	public static Instant synced(final Value publisher) {
		return Xtream

				.of("prefix ec2u: </terms/>\n"
						+"\n"
						+"prefix dct: <http://purl.org/dc/terms/>\n"
						+"prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\n"
						+"prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>\n"
						+"\n"
						+"select (max(?updated) as ?synced) where {\n"
						+"\n"
						+"\t?event a ec2u:Event;\n"
						+"\t\tdct:publisher ?publisher;\n"
						+"\t\tec2u:updated ?updated.\n"
						+"}"
				)

				.flatMap(new TupleQuery()
						.base(EC2U.Base)
						.binding("publisher", publisher)
						.dflt(EC2U.events)
				)

				.optMap(bindings -> literal(bindings.getValue("synced")))

				.map(Literal::temporalAccessorValue)
				.map(Instant::from)

				.findFirst()

				.orElseGet(() -> Instant.now().minus(Duration.ofDays(30)));
	}


	public static void main(final String... args) {
		exec(() -> new Events().run());
	}


	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	private final Graph graph=service(graph());
	private final Logger logger=service(logger());


	@Override public void run() {
		purge();
	}


	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	private void purge() {

		logger.info(this, "removing stale events");

		exec(() -> graph.update(task(connection -> connection

				.prepareUpdate(SPARQL, ""
						+"prefix : </terms/>\n"
						+"prefix schema: <https://schema.org/>\n"
						+"\n"
						+"delete {\n"
						+"\n"
						+"\t?e ?p ?o.\n"
						+"\t?s ?q ?e.\n"
						+"\n"
						+"} where {\n"
						+"\n"
						+"\t?e a :Event.\n"
						+"\n"
						+"\toptional { ?e schema:startDate ?start }\n"
						+"\toptional { ?e schema:endDate ?end }\n"
						+"\n"
						+"\tbind (coalesce(?end, ?start) as ?date)\n"
						+"\n"
						+"\tfilter (bound(?date) && ?date < now() )\n"
						+"\n"
						+"optional { ?e ?p ?o }\n"
						+"\toptional { ?s ?q ?e }\n"
						+"\n"
						+"}", EC2U.Base)

				.execute()

		)));
	}

}
