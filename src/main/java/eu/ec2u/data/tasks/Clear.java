/*
 * Copyright © 2020 Metreeca srl. All rights reserved.
 */

package eu.ec2u.data.tasks;

import com.metreeca.rdf4j.services.Graph;

import static com.metreeca.core.Locator.service;
import static com.metreeca.rdf4j.services.Graph.graph;

import static eu.ec2u.data.tasks.Tasks.exec;


public final class Clear implements Runnable {

	public static void main(final String... args) {
		exec(() -> new Clear().run());
	}


	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	private final Graph graph=service(graph());


	@Override public void run() {
		graph.update(connection -> {

			connection.clear();

			return this;

		});
	}

}
