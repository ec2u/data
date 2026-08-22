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
 * Google Cloud Scheduler integration utilities for Express.
 *
 * Provides OIDC token verification middleware and job handler wrappers for securing endpoints triggered by Google
 * Cloud Scheduler.
 *
 * @module
 *
 * @remarks
 *
 * Authentication is configured via environment variables:
 *
 * - `URL`: The service URL used as the OIDC token audience
 * - `SCHEDULER_SERVICE_ACCOUNT`: Optional service account email to restrict access
 */

import { Forbidden, InternalServerError, Unauthorized } from "@/_/http.js";
import { log } from "@metreeca/tape";
import { type NextFunction, type Request, type Response, Router } from "express";
import { OAuth2Client } from "google-auth-library";


const logger = log(import.meta.url);


const oauth2Client = new OAuth2Client();
const schedulerEmail = process.env.SCHEDULER_SERVICE_ACCOUNT;
const serviceUrl = process.env.URL;


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates an Express router with OIDC authentication middleware for Cloud Scheduler endpoints.
 *
 * Verifies incoming requests contain valid OIDC tokens from Google Cloud Scheduler. Tokens are validated against the
 * configured service URL audience, and optionally restricted to a specific service account email.
 *
 * @returns An Express {@link Router} with authentication middleware applied
 *
 * @remarks
 *
 * Requests are rejected with:
 *
 * - `401 Unauthorized`: Missing, malformed, or invalid OIDC token
 * - `403 Forbidden`: Valid token but from unexpected service account
 *
 * Uses the following environment variables:
 *
 * - `URL`: Service URL for OIDC audience verification (required)
 * - `SCHEDULER_SERVICE_ACCOUNT`: Service account email to restrict access (optional)
 */
export function Scheduler() {
	return Router().use(async (request, response, next) => {

		const token = /^Bearer (.+)$/i.exec(request.headers.authorization ?? "")?.[1];

		if ( token === undefined ) {

			logger.warning("missing or invalid authorization header", {
				method: request.method,
				url: request.url,
				ip: request.ip
			});

			response.status(Unauthorized).json({ error: "unauthorized" });

		} else {

			try {

				const ticket = await oauth2Client.verifyIdToken({
					idToken: token,
					audience: serviceUrl
				});

				const payload = ticket.getPayload();

				if ( schedulerEmail && payload?.email !== schedulerEmail ) {

					logger.warning("token from unexpected service account", {
						expected: schedulerEmail,
						actual: payload?.email,
						method: request.method,
						url: request.url
					});

					response.status(Forbidden).json({ error: "forbidden" });

				}

				next();

			} catch ( error ) {

				logger.error("token verification failed", {
					error: error instanceof Error ? error.message : String(error),
					method: request.method,
					url: request.url
				});

				response.status(Unauthorized).json({ error: "invalid token" });

			}

		}

	});
}

/**
 * Wraps a pipeline handler function with consistent error handling and response formatting.
 *
 * Creates an Express route handler that executes the provided pipeline function, captures its result, and returns a
 * standardized JSON response including the action name, result, and timestamp.
 *
 * @param handler The async pipeline function to execute
 *
 * @returns An Express route handler function
 *
 * @remarks
 *
 * **Success response format:**
 *
 * ```json
 * {
 *   "action": "functionName",
 *   "result": <handler return value>,
 *   "timestamp": 1234567890
 * }
 * ```
 *
 * **Error handling:**
 *
 * - Catches all handler exceptions
 * - Logs errors with action name and stack trace
 * - Returns `500 Internal Server Error` with `{ "error": "action failed" }`
 */
export function job(handler: () => Promise<unknown>) {
	return async (_request: Request, response: Response) => {

		try {

			const result = await handler();

			return response.json({
				action: handler.name,
				result,
				timestamp: Date.now()
			});

		} catch ( error ) {

			logger.error("pipeline action failed", {
				action: handler.name,
				error: error instanceof Error ? error.message : String(error),
				stack: error instanceof Error ? error.stack : undefined
			});

			return response.status(InternalServerError).json({ error: "action failed" });

		}

	};
}
