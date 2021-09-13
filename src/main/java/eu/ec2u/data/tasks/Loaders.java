/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

package eu.ec2u.data.tasks;

import com.metreeca.rdf4j.services.Graph;
import com.metreeca.rdf4j.services.GraphEngine;
import com.metreeca.rest.Toolbox;
import com.metreeca.rest.services.Cache.FileCache;
import com.metreeca.rest.services.Fetcher.CacheFetcher;

import java.nio.file.Paths;
import java.time.Duration;

import static com.metreeca.rdf4j.services.Graph.graph;
import static com.metreeca.rest.Toolbox.storage;
import static com.metreeca.rest.services.Cache.cache;
import static com.metreeca.rest.services.Engine.engine;
import static com.metreeca.rest.services.Fetcher.fetcher;

import static eu.ec2u.data.Data.local;


public final class Loaders {

	public static void exec(final Runnable... tasks) {
		new Toolbox()

				.set(storage(), () -> Paths.get("data"))
				.set(fetcher(), CacheFetcher::new)

				.set(cache(), () -> new FileCache().ttl(Duration.ofDays(1))) // !!!
				.set(graph(), () -> new Graph(local()))

				.set(engine(), GraphEngine::new)

				.exec(tasks)

				.clear();
	}


	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	private Loaders() {}

}
