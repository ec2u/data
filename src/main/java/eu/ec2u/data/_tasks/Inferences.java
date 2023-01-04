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

import com.metreeca.core.Xtream;
import com.metreeca.rdf4j.actions.Update;
import com.metreeca.rdf4j.services.Graph;

import eu.ec2u.data.ontologies.EC2U;

import static com.metreeca.core.Locator.service;
import static com.metreeca.core.toolkits.Lambdas.task;
import static com.metreeca.core.toolkits.Resources.text;
import static com.metreeca.rdf4j.services.Graph.graph;

import static eu.ec2u.data._tasks.Tasks.exec;

import static java.util.function.Predicate.not;


public final class Inferences implements Runnable {

    public static void main(final String... args) {
        exec(() -> new Inferences().run());
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final Graph graph=service(graph());


    @Override public void run() {
        graph.update(task(connection -> {

            connection.clear(EC2U.inferences);

            Xtream.of(text(Inferences.class, ".ql"))
                    .filter(not(String::isEmpty))
                    .forEach(new Update()
                            .base(EC2U.Base)
                            .insert(EC2U.inferences)
                    );

        }));
    }

}
