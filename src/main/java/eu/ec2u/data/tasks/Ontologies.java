/*
 * Copyright © 2020 Metreeca srl. All rights reserved.
 */

package eu.ec2u.data.tasks;

import com.metreeca.rdf4j.actions.Configure;

import eu.ec2u.data.terms.EC2U;

import static eu.ec2u.data.tasks.Tasks.exec;
import static eu.ec2u.data.tasks.Tasks.ontologies;

import static java.util.stream.Collectors.toList;


public final class Ontologies implements Runnable {

    public static void main(final String... args) {
        exec(() -> new Ontologies().run());
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    @Override public void run() {
        new Configure(EC2U.ontologies)

                .langs(EC2U.Languages)

                .accept(ontologies().collect(toList()));
    }

}
