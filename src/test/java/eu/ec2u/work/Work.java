/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

package eu.ec2u.work;

import com.metreeca.rdf4j.assets.GraphEngine;
import com.metreeca.rest.Context;
import com.metreeca.rest.assets.Cache.FileCache;
import com.metreeca.rest.assets.Fetcher.CacheFetcher;

import eu.ec2u.data.Data;

import java.nio.file.Paths;
import java.time.Duration;

import static com.metreeca.rdf4j.assets.Graph.graph;
import static com.metreeca.rest.Context.storage;
import static com.metreeca.rest.assets.Cache.cache;
import static com.metreeca.rest.assets.Engine.engine;
import static com.metreeca.rest.assets.Fetcher.fetcher;


final class Work {

	static void exec(final Runnable... tasks) {
		new Context()

				.set(storage(), () -> Paths.get("data"))
				.set(fetcher(), CacheFetcher::new)

				.set(cache(), () -> new FileCache().ttl(Duration.ofDays(1))) // !!!
				.set(graph(), Data::local)

				.set(engine(), GraphEngine::new)

				.exec(tasks)

				.clear();
	}

}
