/*
 * Copyright © 2020 Metreeca srl. All rights reserved.
 */

package eu.ec2u.data.tasks;

import com.metreeca.rdf.actions.Retrieve;
import com.metreeca.rdf4j.actions.Upload;
import com.metreeca.rest.Xtream;

import eu.ec2u.data.Data;

import static com.metreeca.rest.Toolbox.resource;

import static eu.ec2u.data.tasks.Tasks.exec;


public final class Ontologies implements Runnable {

	public static void main(final String... args) {
		exec(() -> new Ontologies().run());
	}


	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	@Override public void run() {
		Xtream

				.of(resource(Data.class, ".ttl").toExternalForm())

				.bagMap(new Retrieve())

				.batch(0) // avoid multiple truth-maintenance rounds

				.forEach(new Upload()
						.clear(true)
						.contexts(Data.ontologies)
				);
	}

}
