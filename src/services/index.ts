/*
 * Copyright © 2020-2025 EC2U Alliance
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

import { apis } from "@/services/apis.js";
import { log } from "@metreeca/tape";
import type { NextFunction, Request, Response } from "express";
import express from "express";
import jobs from "./jobs.js";
import units from "./units.js";


const logger = log(import.meta.url);


const host = process.env.HOST || "0.0.0.0";
const port = parseInt(process.env.PORT || "8080", 10);
const url = process.env.URL || `http://${host === "0.0.0.0" ? "localhost" : host}:${port}`;

express()

	.use(express.json())

	.use(request())
	.use(error())

	.use(...apis)
	.use(...units)

	.use(...jobs)


	.listen(port, host, () => {
		logger.info`server listening on ${url}`;
		logger.info`API documentation available at ${url}${apis[0]}`;
	});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function request() {
	return (request: Request, response: Response, next: NextFunction) => {

		const requestId = crypto.randomUUID();
		const start = Date.now();

		logger.info("{method} {url}", {
			method: request.method,
			url: request.url,
			userAgent: request.get("User-Agent"),
			ip: request.ip,
			requestId
		});

		const end = response.end.bind(response);

		response.end = function (chunk?: any, ...args: any[]) {

			const details = {
				method: request.method,
				url: request.url,
				statusCode: response.statusCode,
				duration: Date.now()-start,
				requestId
			};

			if ( response.statusCode >= 400 ) {
				logger.warning("{method} {url} {statusCode}", details);
			} else {
				logger.debug("{method} {url} {statusCode}", details);
			}

			return end(chunk, ...args);
		};

		next();

	};
}

function error() {
	return (error: Error, request: Request, response: Response, _: NextFunction) => {

		logger.error("{method} {url} error: {error.name} - {error.message}", {
			error: {
				name: error.name,
				message: error.message,
				stack: error.stack
			},
			method: request.method,
			url: request.url,
			statusCode: response.statusCode || 500
		});

		if ( !response.headersSent ) {
			response.status(500).json({ error: "internal server error" });
		}

	};
}
