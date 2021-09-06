/*
 * Copyright © 2020 Metreeca srl. All rights reserved.
 */

package eu.ec2u.data.handlers;

import com.metreeca.rest.Handler;
import com.metreeca.rest.Response;
import com.metreeca.rest.handlers.Delegator;

import eu.ec2u.data.loaders.Wikidata;
import eu.ec2u.data.loaders.events.Events;

import static com.metreeca.gcp.GCPServer.cron;
import static com.metreeca.rest.MessageException.status;
import static com.metreeca.rest.handlers.Router.router;


public final class Cron extends Delegator {

	public Cron() {
		delegate(cron(router().get(router()

				.path("/wikidata", execute(new Wikidata()))
				.path("/events", execute(new Events()))

		)));
	}


	private Handler execute(final Runnable task) {
		return request -> {

			task.run();

			return request.reply(status(Response.OK));

		};
	}

}
