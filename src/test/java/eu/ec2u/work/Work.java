/*
 * Copyright © 2021 EC2U Consortium
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
