/*
 * Copyright © 2020-2026 EC2U Alliance
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

import { BadRequest, InternalServerError } from "@metreeca/http";
import { log } from "@metreeca/tape";
import type { ErrorRequestHandler, RequestHandler, Router } from "express";
import express from "express";
import { resolve } from "node:path";


const logger = log(import.meta.url);


/**
 * Serves a set of routers over HTTP.
 *
 * Every request is traced, JSON request bodies are decoded, and errors are logged and reported to the client without
 * leaking internal details.
 *
 * When a client is provided, it is served as a single-page application: page loads (`GET` requests accepting
 * `text/html`) receive its `index.html` whatever their path, so that client-side routes survive a reload, while other
 * requests receive its static assets or fall through to the routers.
 *
 * The listening address is taken from the `HOST`, `PORT` and `URL` environment variables, defaulting to `0.0.0.0`,
 * `8080` and the matching local address.
 *
 * @param routers - the routers to be exposed, mounted in the given order
 * @param options - the server options
 * @param options.client - the directory holding the built client, if any
 */
export function serve(routers: readonly Router[], { client }: {

	readonly client?: string

} = {}): void {

	const host = process.env.HOST || "0.0.0.0";
	const port = parseInt(process.env.PORT || "8080", 10);
	const url = process.env.URL || `http://${host === "0.0.0.0" ? "localhost" : host}:${port}`;

	express()

		.use(express.json())

		.use(request())

		.use(...(client === undefined ? [] : [spa(client)]), ...routers)

		.use(error())
		.use(sanitise())

		.listen(port, host, () =>
			logger.info`server listening on ${url}`
		);

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function request(): RequestHandler {

	return (request, response, next) => {

		const trace = crypto.randomUUID();
		const start = Date.now();

		logger.info("{method} {url}", {
			trace,
			method: request.method,
			url: request.url,
			userAgent: request.get("User-Agent"),
			ip: request.ip
		});

		response.locals.trace = trace;

		response.on("close", () => logger[response.statusCode >= BadRequest ? "warning" : "debug"](
			"{method} {url} {statusCode}", {
				trace,
				method: request.method,
				url: request.url,
				statusCode: response.statusCode,
				duration: Date.now()-start
			}
		));

		next();

	};

}

function spa(client: string): RequestHandler {

	const assets = express.static(client, { index: false });
	const index = resolve(client, "index.html"); // sendFile() requires an absolute path

	return (request, response, next) => request.method === "GET" && request.get("Accept")?.includes("text/html")
		? response.sendFile(index)
		: assets(request, response, next);

}

function error(): ErrorRequestHandler {

	return (error, request, response, next) => {

		logger.error("{method} {url} error: {error.name} - {error.message}", {
			trace: response.locals.trace,
			error: {
				name: error.name,
				message: error.message,
				stack: error.stack
			},
			method: request.method,
			url: request.url,
			statusCode: response.statusCode || InternalServerError
		});

		next(error);

	};

}

function sanitise(): ErrorRequestHandler {

	return (error, request, response, next) => {

		if ( !response.headersSent ) {
			response.status(InternalServerError).json({ error: "internal error" });
		}

	};

}
