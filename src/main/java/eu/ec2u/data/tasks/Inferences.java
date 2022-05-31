/*
 * Copyright © 2020 Metreeca srl. All rights reserved.
 */

package eu.ec2u.data.tasks;

import com.metreeca.http.Xtream;
import com.metreeca.rdf4j.actions.Update;

import eu.ec2u.data.terms.EC2U;

import static com.metreeca.core.Lambdas.task;
import static com.metreeca.core.Resources.text;
import static com.metreeca.http.Locator.service;
import static com.metreeca.rdf4j.services.Graph.graph;

import static eu.ec2u.data.tasks.Tasks.exec;


public final class Inferences implements Runnable {

    public static void main(final String... args) {
        exec(() -> new Inferences().run());
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    @Override public void run() {
        service(graph()).update(task(connection -> {

            connection.clear(EC2U.inferences);

            Xtream.of(text(Inferences.class, ".ql"))
                    .forEach(new Update()
                            .base(EC2U.Base)
                            .insert(EC2U.inferences)
                    );

        }));
    }

}
