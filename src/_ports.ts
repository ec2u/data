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

import { events } from "@/events/ports/index.js";
import { units } from "@/units/_ports.js";
import { universities } from "@/universities/ports/index.js";
import { BadRequest, InternalServerError } from "@metreeca/http";
import { log } from "@metreeca/tape";
import type { ErrorRequestHandler, RequestHandler } from "express";
import express from "express";


const logger = log(import.meta.url);


const host = process.env.HOST || "0.0.0.0";
const port = parseInt(process.env.PORT || "8080", 10);
const url = process.env.URL || `http://${host === "0.0.0.0" ? "localhost" : host}:${port}`;


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

express()

	.use(express.json())

	.use(request())

	.use(universities())
	.use(events())

	.use(error())
	.use(sanitise())

	.listen(port, host, () =>
		logger.info`server listening on ${url}`
	);


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

		response.on("close", () => (response.statusCode >= BadRequest ? logger.warning : logger.debug)(
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
