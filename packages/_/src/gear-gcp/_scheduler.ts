/*
 * Copyright © 2026 Metreeca srl
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

/**
 * Google Cloud Scheduler integration for Express.
 *
 * Provides {@link job}, a router factory exposing a pipeline action as an endpoint reachable only by authenticated
 * Google Cloud Scheduler jobs.
 *
 * @module
 */

import { Forbidden, OK, Unauthorized } from "@metreeca/http";
import { log } from "@metreeca/tape";
import { type Request, Router } from "express";
import { OAuth2Client } from "google-auth-library";


const logger = log(import.meta.url);


const oauth2Client = new OAuth2Client();

const schedulerEmail = process.env.SCHEDULER_SERVICE_ACCOUNT;


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates an Express router executing a pipeline action on authenticated Cloud Scheduler requests.
 *
 * The router answers `POST` on its own root, accepting only requests carrying an OIDC bearer token issued by Google
 * for the URL of the request itself, the default audience of a Cloud Scheduler job, and optionally restricted to a
 * single service account. Mount it with `use()`, which strips the mount prefix and leaves the router matching the bare
 * mount path.
 *
 * @param handler The pipeline action awaited on each authorised request; its result is not reported to the caller
 *
 * @returns An Express {@link Router} handling `POST` on its own root; requests with a different method or a deeper
 *          path fall through to the surrounding stack
 *
 * @remarks
 *
 * The request URL is rebuilt from the forwarded protocol and host, so the surrounding server must trust its proxy as
 * the gate server does on Cloud Run.
 *
 * A completed action is reported with an empty `200 OK`, as Cloud Scheduler judges an attempt by its status code
 * alone. A rejected action is left to propagate to the error middleware of the surrounding stack, which reports it
 * and answers the request.
 *
 * Actions must complete within the attempt deadline configured on the triggering job, 3 minutes by default and 30
 * minutes at most: Cloud Scheduler cancels a longer attempt and marks it failed, no matter how the action ends.
 *
 * Unauthorised requests are rejected with a bodiless response:
 *
 * - `401 Unauthorized`: Missing, malformed, or invalid OIDC token
 * - `403 Forbidden`: Valid token, but from an unexpected service account
 *
 * Uses the following environment variable:
 *
 * - `SCHEDULER_SERVICE_ACCOUNT`: Service account email to restrict access (optional)
 *
 * @see {@link https://cloud.google.com/scheduler/docs/http-target-auth Cloud Scheduler HTTP target authentication}
 */
export function job(handler: () => Promise<unknown>): Router {

	// !!! can we decouple from express?

	// !!! redundant once the Cloud Run IAM policy is in place (package.sh --deploy): the service admits only callers
	// !!! granted the invoker role, and Cloud Run verifies the OIDC token before the request reaches the router

	return Router()

		.post("/", async (request, response) => { // scoped to the root, so deeper paths are reported as unknown rather than unauthorised

			const status = await authorize(request);

			if ( status === OK ) {

				await handler(); // outside authorize(), so that rejections reach the error middleware

				response.status(OK).end();

			} else {

				response.status(status).end();

			}

		});

}


async function authorize(request: Request): Promise<number> {

	const token = /^Bearer (.+)$/i.exec(request.headers.authorization ?? "")?.[1];

	if ( token === undefined ) {

		logger.warning("missing or invalid authorization header", {
			method: request.method,
			url: request.url,
			ip: request.ip
		});

		return Unauthorized;

	} else {

		try {

			const ticket = await oauth2Client.verifyIdToken({
				idToken: token,
				audience: `${request.protocol}://${request.host}${request.originalUrl}`
			});

			const email = ticket.getPayload()?.email;

			if ( schedulerEmail && email !== schedulerEmail ) {

				logger.warning("token from unexpected service account", {
					expected: schedulerEmail,
					actual: email,
					method: request.method,
					url: request.url
				});

				return Forbidden;

			} else {

				return OK;

			}

		} catch ( error ) {

			logger.error("token verification failed", {
				error: error instanceof Error ? error.message : String(error),
				method: request.method,
				url: request.url
			});

			return Unauthorized;

		}

	}

}
