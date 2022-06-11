/*
 * Copyright © 2020 Metreeca srl. All rights reserved.
 */

package eu.ec2u.data.tasks;

import com.metreeca.rdf.actions.Retrieve;
import com.metreeca.rdf4j.actions.Upload;

import eu.ec2u.data.terms.EC2U;

import java.net.URL;

import static eu.ec2u.data.tasks.Tasks.exec;
import static eu.ec2u.data.tasks.Tasks.ontologies;


public final class Ontologies implements Runnable {

	public static void main(final String... args) {
		exec(() -> new Ontologies().run());
	}


	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	@Override public void run() {
		ontologies()

				.map(URL::toExternalForm)
				.bagMap(new Retrieve())

				.batch(0) // avoid multiple truth-maintenance rounds

				.forEach(new Upload()
						.clear(true)
						.contexts(EC2U.ontologies)
				);
	}

}
