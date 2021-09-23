/*
 * Copyright © 2020 Metreeca srl. All rights reserved.
 */

package eu.ec2u.data.tasks;

import com.metreeca.rest.Xtream;

import eu.ec2u.data.Data;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.Rio;
import org.eclipse.rdf4j.rio.helpers.AbstractRDFHandler;

import java.io.IOException;
import java.io.UncheckedIOException;

import static com.metreeca.rdf4j.services.Graph.graph;
import static com.metreeca.rest.Toolbox.resource;
import static com.metreeca.rest.Toolbox.service;
import static com.metreeca.rest.Xtream.task;

import static eu.ec2u.data.tasks.Tasks.exec;


public final class Namespaces implements Runnable {

	public static void main(final String... args) {
		exec(() -> new Namespaces().run());
	}


	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	@Override public void run() {
		service(graph()).update(task(connection -> {

			connection.clearNamespaces();

			Xtream.of(resource(Data.class, ".ttl")).forEach(path -> {
				try {

					Rio.createParser(RDFFormat.TURTLE).setRDFHandler(new AbstractRDFHandler() {

						@Override public void handleNamespace(final String prefix, final String uri) {

							connection.setNamespace(prefix, uri);

						}

					}).parse(path.openStream());

				} catch ( final IOException e ) {

					throw new UncheckedIOException(e);

				}

			});

		}));
	}

}
