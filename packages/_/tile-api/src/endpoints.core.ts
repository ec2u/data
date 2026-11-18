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

import type { ResourceShape } from "@metreeca/blue/resource";
import { eager } from "@metreeca/blue/value";
import type { Lazy } from "@metreeca/core";


/**
 * The routes served by an API, in mounting order, each mapped to the shape of the resources it serves.
 *
 * Routes are root-relative paths in Express syntax, as `/universities/:code`; container routes end with a slash.
 */
export type Endpoints = {

	readonly [route: string]: Lazy<ResourceShape>

};


/**
 * The scheme and authority of absolute patterns, left out when matching them against routes.
 */
const origin = /^[a-z][a-z0-9+.-]*:\/\/[^/]*/i;


/**
 * A step of a path template: a fixed segment, a single segment of any value, or one or more trailing segments.
 */
type Segment =
	| { readonly kind: "literal", readonly value: string }
	| { readonly kind: "one" | "rest" }


/**
 * Lists the routes serving the resources a shape describes.
 *
 * A route serves a shape if it is mounted for the shape itself, or if it is mounted for a shape the shape extends and
 * its path can name a resource whose identifier matches the identifier pattern the shape states, as the concepts route
 * serves the concepts of a single taxonomy.
 *
 * @param endpoints The routes served by the API, each mapped to the shape of the resources it serves
 * @param shape The shape whose routes are to be listed, possibly deferred
 *
 * @returns The routes serving `shape`, in mounting order; empty if no route serves it
 */
export function getShapeEndpoints(endpoints: Endpoints, shape: Lazy<ResourceShape>): readonly string[] {

	const target = eager(shape);
	const { pattern } = target;
	const lineage = ancestors(target);

	const routes = Object.entries(endpoints);

	const own = routes.filter(([, served]) => eager(served) === target);

	const inherited = routes.filter(([route, served]) =>
		lineage.includes(eager(served)) && pattern !== undefined && overlaps(pattern, route)
	);

	return (own.length > 0 ? own : inherited).map(([route]) => route);

}

/**
 * Lists the shapes served at container routes.
 *
 * A container route ends with a slash, as `/universities/` or the root route `/`, and serves a resource listing
 * others, which clients enter the model from.
 *
 * @param endpoints The routes served by the API, each mapped to the shape of the resources it serves
 *
 * @returns The shapes served at container routes, in mounting order
 */
export function getContainers(endpoints: Endpoints): readonly Lazy<ResourceShape>[] {
	return Object.entries(endpoints).filter(([route]) => route.endsWith("/")).map(([, shape]) => shape);
}

/**
 * Measures how deep a route is nested among the routes served.
 *
 * A route is nested under each other route whose path it extends by whole segments, as `/universities/:code` under
 * `/universities/` and `/`, so that a listing can indent each route under the ones it extends.
 *
 * @param endpoints The routes served by the API, each mapped to the shape of the resources it serves
 * @param route The root-relative path of the route, in Express syntax
 *
 * @returns The number of served routes `route` extends; `0` for a route extending none of them
 */
export function getEndpointDepth(endpoints: Endpoints, route: string): number {
	return Object.keys(endpoints)
		.filter(base => base !== route && route.startsWith(base.endsWith("/") ? base : `${base}/`))
		.length;
}

/**
 * Names the anchor of a route among the API routes listed on the models index page.
 *
 * @param route The root-relative path of the route, in Express syntax
 *
 * @returns The fragment identifier of `route`, as `route-universities-code` for `/universities/:code`, or `route` for
 *     the root route
 */
export function getEndpointAnchor(route: string): string {
	return ["route", ...route.split(/[^A-Za-z0-9]+/).filter(step => step !== "")].join("-").toLowerCase();
}

/**
 * Checks whether an identifier pattern and a route can name the same resource.
 *
 * Both are read as path templates and overlap if some path matches both:
 *
 * - `pattern` follows the blue syntax: `{name}` stands for one path segment, a trailing `/*` for one or more, and a
 *   trailing `/` names a container; an absolute pattern is matched on its path alone, ignoring the origin
 * - `route` follows the Express syntax: `:name` stands for one path segment and `*name` for one or more; it is the
 *   full path a handler is mounted at, nested router prefixes included
 *
 * @param pattern The identifier pattern stated by a shape, absolute or root-relative
 * @param route The root-relative path of a route
 *
 * @returns `true` if some root-relative path matches both `pattern` and `route`; `false` otherwise
 */
export function overlaps(pattern: string, route: string): boolean {
	return overlap(parse(pattern.replace(origin, ""), "{", "*"), parse(route, ":", "*"));
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Lists the shapes a shape extends, directly or through other shapes.
 */
function ancestors(shape: ResourceShape): readonly ResourceShape[] {
	return shape.parents.map(parent => eager(parent)).flatMap(parent => [parent, ...ancestors(parent)]);
}

/**
 * Splits a root-relative path template into segments, telling placeholders apart by their leading character; a
 * trailing slash yields a final empty segment, which keeps containers apart from their items.
 */
function parse(path: string, one: string, rest: string): readonly Segment[] {
	return path.split("/").slice(1).map((segment): Segment => segment.startsWith(one) ? { kind: "one" }
		: segment.startsWith(rest) ? { kind: "rest" }
			: { kind: "literal", value: segment }
	);
}

/**
 * Checks whether some path matches two templates, a trailing wildcard absorbing whatever non-empty segments remain on
 * the other side.
 */
function overlap(a: readonly Segment[], b: readonly Segment[]): boolean {

	const [x, ...xs] = a;
	const [y, ...ys] = b;

	return x === undefined || y === undefined ? x === y
		: x.kind === "rest" ? xs.length === 0 && b.every(filled)
			: y.kind === "rest" ? ys.length === 0 && a.every(filled)
				: compatible(x, y) && overlap(xs, ys);

}

/**
 * Checks whether two single segments can match the same path segment.
 */
function compatible(x: Segment, y: Segment): boolean {
	return x.kind === "literal" && y.kind === "literal" ? x.value === y.value : filled(x) && filled(y);
}

/**
 * Checks whether a segment can match a non-empty path segment.
 */
function filled(segment: Segment): boolean {
	return segment.kind !== "literal" || segment.value !== "";
}
