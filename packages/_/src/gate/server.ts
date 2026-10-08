/*
 * Copyright © 2026 Metreeca srl. All rights reserved.
 */

/**
 * HTTP server hosting an Express router behind a proxy, as on Cloud Run.
 *
 * @module gate
 */

import { isError, isNumber } from "@metreeca/core";
import { BadRequest, InternalServerError, NotFound } from "@metreeca/http";
import { log } from "@metreeca/tape";
import express, { type ErrorRequestHandler, type RequestHandler, type Router } from "express";


const logger = log(import.meta.url);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Serves a router created for the public base URL of the server over HTTP.
 *
 * Behaves as the overload serving a ready router, for routers whose handlers depend on the address clients reach the
 * server at, for example to verify the audience of the tokens they accept.
 *
 * @param factory A function creating the router given the public base URL of the server; the function may throw to
 *                reject its own settings, and the server is then not started
 *
 * @returns A promise resolving when the server closes, and rejecting if `URL` is malformed, the router cannot be
 *     created or the server fails to listen
 */
export function serve(factory: (url: string) => Router): Promise<void>;

/**
 * Serves a router over HTTP, with the listening address read from the environment:
 *
 * - `PORT`: the listening port; defaults to `8080`
 * - `HOST`: the listening address; defaults to `0.0.0.0`
 * - `URL`: the public base URL clients reach the server at; defaults to `http://<HOST>:<PORT>`, with `localhost`
 *   standing for `0.0.0.0`
 *
 * Every request is traced in the log with its outcome and duration. Requests no route matches are answered with a
 * bodiless `404`; errors no route handles are logged and answered with a bodiless response, carrying their own client
 * error status if any and `500` otherwise, so that no internal detail reaches the client. The server trusts the first
 * proxy hop, as required behind a front end such as Cloud Run's, so that the router sees the caller address rather than
 * the proxy's.
 *
 * The server closes on `SIGINT` or `SIGTERM`, completing the requests in flight before it stops.
 *
 * @param router The router serving the application
 *
 * @returns A promise resolving when the server closes, and rejecting if `URL` is malformed or the server fails to
 *     listen
 */
export function serve(router: Router): Promise<void>;

export async function serve(router: Router | ((url: string) => Router)): Promise<void> {

	const host = process.env.HOST || "0.0.0.0";
	const port = parseInt(process.env.PORT || "8080", 10);
	const url = process.env.URL || `http://${host === "0.0.0.0" ? "localhost" : host}:${port}`;

	const authority = new URL(url).host;

	return new Promise<void>((resolve, reject) => {

		const server = express()

			.set("trust proxy", 1)
			.disable("x-powered-by")

			.use(tracing())

			.use(isRouter(router) ? router : router(url))

			.use(unmatched())
			.use(unhandled())

			.listen(port, host, () => authority === `${host}:${port}`
				? logger.info`serving ${url}`
				: logger.info`serving ${url} from ${host}:${port}`
			)

			.on("close", () => {
				logger.info`shutting down`;
				resolve();
			})

			.on("error", reject);

		const close = () => server.close();

		process.once("SIGINT", close);
		process.once("SIGTERM", close);

	});


	function isRouter(value: unknown): value is Router {
		return value instanceof express.Router;
	}

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function tracing(): RequestHandler {

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

function unmatched(): RequestHandler {

	return (_, response) => {

		response.status(NotFound).end();

	};

}

function unhandled(): ErrorRequestHandler {

	return (error, request, response, next) => {

		const code = isStatusError(error) && error.status >= BadRequest && error.status < InternalServerError
			? error.status
			: InternalServerError;

		logger.error("{method} {url} error: {error.name} - {error.message}", {
			trace: response.locals.trace,
			error: {
				name: error.name,
				message: error.message,
				stack: error.stack
			},
			method: request.method,
			url: request.url,
			statusCode: code
		});

		if ( response.headersSent ) {
			next(error);
		} else {
			response.status(code).end();
		}

	};


	function isStatusError(value: unknown): value is Error & { status: number } {
		return isError(value) && "status" in value && isNumber(value.status);
	}

}
