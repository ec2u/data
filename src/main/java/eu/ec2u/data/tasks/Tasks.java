/*
 * Copyright © 2022 EC2U Consortium. All rights reserved.
 */

package eu.ec2u.data.tasks;

import com.metreeca.json.Frame;
import com.metreeca.rdf4j.services.Graph;
import com.metreeca.rdf4j.services.GraphEngine;
import com.metreeca.rest.Toolbox;
import com.metreeca.rest.services.Cache;
import com.metreeca.rest.services.Fetcher;

import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.Rio;

import java.io.*;
import java.nio.file.Paths;
import java.time.Duration;
import java.util.stream.Collectors;

import static com.metreeca.rdf4j.services.Graph.graph;
import static com.metreeca.rest.Toolbox.storage;
import static com.metreeca.rest.services.Cache.cache;
import static com.metreeca.rest.services.Engine.engine;
import static com.metreeca.rest.services.Fetcher.fetcher;

import static eu.ec2u.data.Data.development;

public final class Tasks {

	public static void exec(final Runnable... tasks) {
		new Toolbox()

				.set(storage(), () -> Paths.get("data"))
				.set(fetcher(), Fetcher.CacheFetcher::new)

				.set(cache(), () -> new Cache.FileCache().ttl(Duration.ofDays(1)))
				.set(graph(), () -> new Graph(development()))

				.set(engine(), GraphEngine::new)

				.exec(tasks)

				.clear();
	}


	public static String format(final Frame frame) {
		return format(frame.model().collect(Collectors.toList()));
	}

	public static String format(final Iterable<Statement> model) {
		try ( final StringWriter writer=new StringWriter() ) {

			Rio.write(model, writer, RDFFormat.TURTLE);

			return writer.toString();

		} catch ( final IOException e ) {

			throw new UncheckedIOException(e);

		}
	}


	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	private Tasks() { }

}
