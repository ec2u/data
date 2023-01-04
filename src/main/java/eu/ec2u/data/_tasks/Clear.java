/*
 * Copyright © 2020-2023 EC2U Alliance
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

package eu.ec2u.data._tasks;

import com.metreeca.rdf4j.services.Graph;

import static com.metreeca.core.Locator.service;
import static com.metreeca.rdf4j.services.Graph.graph;

import static eu.ec2u.data._tasks.Tasks.exec;


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
