/*
 * Copyright © 2026 Metreeca srl. All rights reserved.
 */

/**
 * HTTP server for Express applications.
 *
 * The server takes care of the concerns every HTTP service shares, such as request logging, error responses and
 * graceful shutdown, letting applications focus on their routes.
 *
 * @module index
 */

import { assert, isArray, isError, isNumber, isObject } from "@metreeca/core";
import { BadRequest, InternalServerError, NotFound } from "@metreeca/http";
import { log } from "@metreeca/tape";
import express, { type ErrorRequestHandler, type Express, type RequestHandler } from "express";
import type { Server as HTTPServer } from "node:http";


const logger = log(import.meta.url);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export type ServerOpts = {

	/**
	 * The address the server listens on; if omitted or empty, the server listens on every interface, over IPv4 and
	 * IPv6 alike, as containers and hosting platforms require.
	 *
	 * Set it to `localhost` to keep a local server unreachable from the network.
	 */
	readonly host?: string;

	/**
	 * The port the server listens on, from `0` to `65535`; if omitted or `0`, the server listens on a free port
	 * assigned by the operating system.
	 */
	readonly port?: number;

	/**
	 * The number of proxy hops in front of the server whose forwarded caller address is trusted; defaults to `0`.
	 *
	 * Trusted hops let the router see the address of the caller rather than that of a proxy. The default trusts no
	 * forwarded address, as fits a server exposed directly, where clients could otherwise forge their address.
	 *
	 * Set it to the number of proxies in front of the server, for instance `1` behind the front-end proxy of a hosting
	 * platform, or `2` behind a load balancer in front of that proxy.
	 */
	readonly proxies?: number;

	/**
	 * The milliseconds a close waits for the requests in flight before closing their connections; `0`, the default,
	 * waits for them indefinitely, leaving the limit to the hosting platform.
	 *
	 * Set it below the grace period the hosting platform allows between the termination signal and a forced kill, so
	 * that the server closes lingering connections and exits cleanly before being killed.
	 */
	readonly timeout?: number;

	/**
	 * A signal closing the server when aborted, as `SIGINT` or `SIGTERM` would; a signal that is already aborted closes
	 * the server as soon as it is listening.
	 */
	readonly signal?: AbortSignal;

};

/**
 * HTTP serving extension for Express applications.
 */
export type Server = {

	/**
	 * Serves the application over HTTP.
	 *
	 * Every request is traced in the log with its outcome and duration. Requests that match no route get a bodiless
	 * `404`. Errors that no route handles are logged, and the client gets a bodiless response: the error status for
	 * client errors, `500` otherwise.
	 *
	 * Once listening, the server runs until it is closed, either on demand by aborting the `signal` or by `SIGINT` or
	 * `SIGTERM`.
	 *
	 * Closing refuses new connections at once, while the requests in flight are completed within the `timeout`.
	 * Repeating the process signal that started the close terminates the process.
	 *
	 * Calls in the native Express form, with a port, a path or a callback, keep their standard behaviour and return the
	 * underlying `http.Server`.
	 *
	 * @param options The server options; every option may be omitted
	 *
	 * @returns A promise resolving once the server is closed, and rejecting if an option is malformed or the server
	 *     fails to listen
	 */
	listen(options?: ServerOpts): Promise<void>;

};


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates an Express application served over HTTP.
 *
 * @returns A new Express application, whose `listen()` serves it as described by {@link Server.listen}
 */
export function server(): Server & Express {

	return Object.assign(express(), { listen });


	function listen(this: Express, options?: ServerOpts): Promise<void>;
	function listen(this: Express, ...args: unknown[]): Promise<void> | HTTPServer {

		if ( isArray<ServerOpts>(args, value => isObject(value)) ) {

			const [{

				host = "",
				port = 0,
				proxies = 0,
				timeout = 0,
				signal

			} = {}] = args;

			return new Promise<void>((resolve, reject) => {

				assert(host, isHost, `malformed host <${host}>`);
				assert(port, isPort, `malformed port <${port}>`);
				assert(proxies, isCount, `malformed proxies <${proxies}>`);
				assert(timeout, isTimeout, `malformed timeout <${timeout}>`);

				const server = express()

					.set("trust proxy", proxies)
					.disable("x-powered-by")

					.use(tracing())

					.use(this)

					.use(unmatched())
					.use(unhandled())

					.listen({ port, host }, () => {

						server.off("error", reject); // failures after listening are no longer startup failures

						const address = server.address(); // the actual port, if assigned by the operating system

						logger.info`listening on ${host || "every interface"} at port ${isObject(address) ? address.port : port}`;

						process.once("SIGINT", close);
						process.once("SIGTERM", close);

						if ( signal?.aborted ) {
							close();
						} else {
							signal?.addEventListener("abort", close, { once: true });
						}

					});

				server.once("error", reject);

				server.once("close", () => {

					process.off("SIGINT", close);
					process.off("SIGTERM", close);

					signal?.removeEventListener("abort", close);

					resolve();

				});


				function close(): void {

					if ( server.listening ) { // not closing yet

						logger.info`shutting down`;

						const timer = timeout > 0 ? setTimeout(() => server.closeAllConnections(), timeout) : undefined;

						server.close(() => clearTimeout(timer));

					}

				}

			});

		} else {

			return Reflect.apply(express.application.listen, this, args);

		}

	}

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function isHost(value: string): boolean {
	return /^\S*$/u.test(value);
}

function isPort(value: number): boolean {
	return Number.isInteger(value) && value >= 0 && value <= 65535;
}

function isCount(value: number): boolean {
	return Number.isInteger(value) && value >= 0;
}

function isTimeout(value: number): boolean {
	return Number.isInteger(value) && value >= 0;
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
