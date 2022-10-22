/*
 * Copyright © 2020 Metreeca srl. All rights reserved.
 */

package eu.ec2u.data.tasks;

import com.metreeca.core.Xtream;
import com.metreeca.rdf4j.actions.Update;
import com.metreeca.rdf4j.services.Graph;

import eu.ec2u.data.terms.EC2U;

import static com.metreeca.core.Locator.service;
import static com.metreeca.core.toolkits.Lambdas.task;
import static com.metreeca.core.toolkits.Resources.text;
import static com.metreeca.rdf4j.services.Graph.graph;

import static eu.ec2u.data.tasks.Tasks.exec;

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
