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

/**
 * Virtual collection drivers.
 *
 * Stand-in for `@metreeca/gate/driver` extending `lookup()` with virtual collections, until they move to gate.
 *
 * @module
 */

import { validate } from "@metreeca/blue";
import { getShapeTarget, reference } from "@metreeca/blue/reference";
import { getShapeProperties, multiple, resource, type ResourceShape } from "@metreeca/blue/resource";
import { eager } from "@metreeca/blue/value";
import { error, isArray, isObject, isString, type Lazy } from "@metreeca/core";
import { resolve } from "@metreeca/core/resource";
import { TraceError } from "@metreeca/core/trace";
import {
	BadRequest,
	GET,
	HEAD,
	MethodNotAllowed,
	NoContent,
	NotImplemented,
	OK,
	OPTIONS,
	UnprocessableContent
} from "@metreeca/http";
import type { Store, StoreScope } from "@metreeca/keep";
import { decodeCriteria, decodeTemplate, type Query, type Slot, type Template } from "@metreeca/qest/model";
import { encodeResource, isValue, type Value } from "@metreeca/qest/state";
import type { Request, RequestHandler, Response } from "express";


// !!! gate-internal settings (@metreeca/gate/index.core.ts), until virtual collections move to gate

const BaseSetting = "@metreeca/gate:base";
const StoreSetting = "@metreeca/gate:store";
const ScopeSetting = "@metreeca/gate:scope";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Retrieval hooks, as accepted by the `lookup()` method of a {@link Driver}.
 */
export type LookupHooks = {

	/**
	 * The server template stating the constraints every member of the virtual collection must meet, alongside the
	 * client query; only the entry naming the collection property of the driver shape is honoured.
	 */
	readonly model?: Template

	/**
	 * The stored resource the members of the virtual collection held by the driver shape are linked to. Without it,
	 * members are matched by the member shape and the server template alone, a retrieval keep doesn't support yet.
	 */
	readonly virtual?: Virtual

}

/**
 * Virtual collection source.
 *
 * Selects the members of a collection with no record stored at its address: the resources linked to a stored resource
 * along a path of properties. Each property along the path needs a backlink on the resource it points to.
 */
export type Virtual = {

	/**
	 * The identifier of the stored resource the members are linked to.
	 */
	readonly entry: string

	/**
	 * The properties leading from each member to the {@link entry}, starting from the collection member shape.
	 */
	readonly path: readonly [string, ...string[]]

}

/**
 * Model-driven resource driver.
 *
 * Read-only stand-in for the gate `Driver`, serving virtual collections: `lookup()` is the only method it enables.
 */
export type Driver = RequestHandler & {

	/**
	 * Enables `GET` and `HEAD`, retrieving the virtual collection held by the driver shape.
	 *
	 * Clients query the collection as a stored one, by template or by form criteria. Members are served under the
	 * collection property of the driver shape, in a resource named after the request path.
	 *
	 * - `200 OK` with the collection as JSON, empty where the stored resource is missing
	 * - `400 Bad Request` with the error message, where the query component cannot be decoded
	 * - `422 Unprocessable Content` with the trace or message, where validation or the store rejects the template
	 * - `501 Not Implemented`, where no {@link LookupHooks.virtual | virtual} source links members to a stored resource
	 *
	 * @param hooks Retrieval hooks
	 *
	 * @returns This driver
	 */
	lookup(hooks: LookupHooks): Driver

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates a resource driver.
 *
 * Like a gate `driver()`, the driver serves the path it is mounted on, with or without a trailing slash, and passes
 * requests for paths below it on to the next handler, so the drivers of its items can be mounted beneath it.
 *
 * @param shape The shape of the virtual collection served, holding a single collection property
 *
 * @returns A driver with no method enabled
 */
export function driver(shape: Lazy<ResourceShape>): Driver {

	// methods are held in a registry the dispatcher reads at request time, as in gate drivers

	const handlers = new Map<string, RequestHandler>();

	const allow = () => Methods
		.filter(method => method === HEAD ? handlers.has(GET) : method === OPTIONS || handlers.has(method))
		.join(", ");

	const dispatcher: RequestHandler = (request, response, next) => {

		const served = handlers.get(request.method === HEAD ? GET : request.method);

		return handlers.size === 0 || request.path !== "/" ? next()
			: served !== undefined ? served(request, response, next)
				: response.status(request.method === OPTIONS ? NoContent : MethodNotAllowed).set("Allow", allow()).end();

	};

	const self: Driver = Object.assign(dispatcher, {

		lookup: ({ model = {}, virtual }: LookupHooks) => {

			const name = collection(shape);
			const server = model[name] ?? {};

			handlers.set(GET, virtual === undefined ? unsupported : anchored(name, server, member(shape, name), virtual));

			return self;

		}

	});

	return self;

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const Methods: readonly string[] = [GET, HEAD, OPTIONS];


function collection(shape: Lazy<ResourceShape>): string {

	const collections = Object.entries(getShapeProperties(shape))
		.filter(([, member]) => member.kind === "property"
			&& member.range.maxCount !== 1
			&& eager(member.range.shape).kind !== "dictionary" // a language map is stated whole and takes no criteria
		)
		.map(([name]) => name);

	return collections.length === 1 ? collections[0]
		: collections.length === 0 ? error<string>(new TypeError("missing collection property"))
			: error<string>(new TypeError(`conflicting collection properties [${collections.join(", ")}]`));

}

function unsupported(_request: Request, response: Response): void {

	// !!! keep retrieves only collection members linked from the entry

	response.status(NotImplemented).send("unanchored virtual collections not supported");

}

function anchored(name: string, server: Query<Slot>, shape: ResourceShape, { entry, path }: Virtual): RequestHandler {

	const [target, steps] = invert(shape, path);

	return (request, response, next) => lookup({
		name, entry, target, steps, server
	}, request, response).catch(next);

}


function member(shape: Lazy<ResourceShape>, name: string): ResourceShape {

	const property = getShapeProperties(shape)[name];
	const target = property?.kind === "property" ? getShapeTarget(property.range.shape) : undefined;

	return target ?? error<ResourceShape>(new TypeError(`undefined member shape for <${name}>`));

}

/**
 * Inverts a path of properties leading from a member to the entry.
 *
 * @returns The shape of the entry and the backlinks leading from it to the members
 */
function invert(shape: ResourceShape, path: readonly string[]): readonly [ResourceShape, readonly string[]] {

	const [head, ...tail] = path;

	return head === undefined ? [shape, []] : step(shape, head, tail);

}

function step(shape: ResourceShape, name: string, tail: readonly string[]
): readonly [ResourceShape, readonly string[]] {

	const property = getShapeProperties(shape)[name];
	const target = property?.kind === "property" ? getShapeTarget(property.range.shape) : undefined;

	const backlink = property?.kind !== "property" || target === undefined ? undefined
		: Object.entries(getShapeProperties(target)).find(([, link]) => link.kind === "property" && (
			property.forward !== undefined && link.reverse === property.forward
			|| property.reverse !== undefined && link.forward === property.reverse
		))?.[0];

	// narrow the backlink range to the shape walked from, so that nested steps are known to the entry shape

	const [entry, steps] = target !== undefined && backlink !== undefined
		? invert(resource(target, { [backlink]: multiple(reference(shape)) }), tail)
		: error<readonly [ResourceShape, readonly string[]]>(new TypeError(`undefined backlink for <${name}>`));

	return [entry, [...steps, backlink ?? name]];

}

function nest(steps: readonly string[], query: Query<Slot>): Template {

	const [head, ...tail] = steps;

	return head === undefined ? {}
		: { [head]: tail.reduceRight<Query<Slot>>((nested, name) => ({ [name]: nested }), query) };

}


function lookup({ name, entry, target, steps, server }: {

	readonly name: string
	readonly entry: string
	readonly target: ResourceShape
	readonly steps: readonly string[]
	readonly server: Query<Slot>

}, request: Request, response: Response): Promise<unknown> {

	const $base = base(request);
	const $scope = deepen(scope(request), steps.length); // backlink steps are hidden from clients

	const locale = request.acceptsLanguages().filter(tag => tag !== "*");

	const url = new URL(request.originalUrl, $base);
	const client = decode(name, url.search.slice(1), $base);

	return client instanceof Error ? Promise.resolve(response.status(BadRequest).send(client.message))
		: validate<Template>(nest(steps, { ...client, ...server }), { shape: target, model: true, ...$scope })({

			value: template => storage(request).lookup({ entry, shape: target, model: template }, {
				...$scope,
				...(locale.length > 0 ? { locale } : {})
			}).then(

				match => response.status(OK).type("json").send(encodeResource({
					id: resolve($base, url.pathname),
					[name]: members(match, steps)
				}, { base: $base })),

				cause => cause instanceof TraceError ? response.status(UnprocessableContent).json(cause.cause)
					: cause instanceof RangeError ? response.status(UnprocessableContent).send(cause.message)
						: Promise.reject(cause)
			),

			trace: trace => Promise.resolve(response.status(UnprocessableContent).json(trace))

		});

}

function deepen(scope: StoreScope, steps: number): StoreScope {

	return scope.depth === undefined ? scope : { ...scope, depth: scope.depth+steps };

}

function decode(name: string, encoded: string, base: string): Query<Slot> | Error {

	try {
		return query(name, encoded, base);
	} catch ( cause ) {
		return cause instanceof Error ? cause : new Error(String(cause));
	}

}

function query(name: string, encoded: string, base: string): Query<Slot> {

	// plain JSON may hold any character, but form data pairs always carry a raw `=` (as in gate driver parsing)

	return encoded === "" ? {}
		: !encoded.startsWith("{") && encoded.includes("=") ? decodeCriteria(encoded, { base })
			: decodeTemplate(encoded, { base })[name] ?? {};

}

function members(value: unknown, path: readonly string[]): readonly Value[] {

	const [head, ...tail] = path;

	return head === undefined ? (isValue(value) ? [value] : [])
		: isObject(value) && isArray(value[head]) ? value[head].flatMap(item => members(item, tail))
			: [];

}


function storage(request: Request): Store {

	const store: undefined | Store = request.app.get(StoreSetting);

	return store ?? error(new Error("undefined application store"));

}

function base(request: Request): string {

	const server: unknown = request.app.get(BaseSetting);

	return isString(server) ? server : `${request.protocol}://${request.get("host")}`;

}

function scope(request: Request): StoreScope {

	const server: undefined | StoreScope = request.app.get(ScopeSetting);

	return server ?? {};

}
