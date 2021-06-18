/*
 * Copyright © 2020 Metreeca srl. All rights reserved.
 */

package eu.ec2u.data.handlers;

import com.metreeca.rest.Response;
import com.metreeca.rest.handlers.Delegator;

import static com.metreeca.gcp.GCPServer.cron;
import static com.metreeca.rest.handlers.Router.router;


public final class Cron extends Delegator {

	public Cron() {
		delegate(cron(router().get(router()

				.path("/events", request -> request.reply(response -> {

							// !!! new Crawler().run();

							return response.status(Response.OK);

						})
				)

		)));
	}

}
