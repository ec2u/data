/*
 * Copyright © 2020-2021 Metreeca srl
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

import { createContext, createElement, FunctionComponent, ReactElement, useContext, useEffect, useMemo, useReducer, useState } from "react";
import { Frame, label } from "../bases";
import { report } from "../index";

const ActiveAttribute="active";
const NativeAttribute="native";
const TargetAttibute="target";

const RouterContext=createContext<Router>(router({ store: path(), update: () => {} }));


window.addEventListener("error", e => report(e.message));
window.addEventListener("unhandledrejection", e => report(e.reason));


(function (route, index) { // ;( dev server fallback

	if ( route.endsWith(index) ) {
		history.replaceState(history.state, document.title, route.substr(0, route.length-index.length+1));
	}

})(location.pathname, "/index.html");


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Absolute root URL with trailing slash.
 */
export const root=new URL("/", location.href).href;

/**
 * Absolute base URL with trailing slash.
 */
export const base=new URL(".", new URL(document.querySelector("base")?.href || "", location.href)).href;

export const name=document.title;
export const icon=(document.querySelector("link[rel=icon]") as HTMLLinkElement)?.href || ""; // !!! many/none
export const copy=(document.querySelector("meta[name=copyright]") as HTMLMetaElement)?.content || "";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Routing switch.
 */
export interface Switch {

	/**
	 * Retrieves a component responsible for rendering a route.
	 *
	 * @param route the route to be rendered
	 *
	 * @returns a a rendering of `route` or a new route if a redirection is required
	 */
	(route: string): ReactElement | string;

}

/**
 * Routing table.
 */
export interface Table {

	/**
	 * Maps glob patterns either to components or redirection patterns.
	 *
	 * Patterns may include the following wildcards, where `id` is a sequence of word chars:
	 *
	 * - `{id}` matches a non empty named path step
	 * - `{}` matches a non-empty anonymous path step
	 * - `/*` matches a trailing path
	 *
	 * Redirection patterns may refer to wildcards in the matched route pattern as:
	 *
	 * - `{id}` replaced with the matched non empty named path step
	 * - `{}` replaced with the whole matched route
	 * - `/*` replaced with the matched trailing path
	 *
	 * Named path step in the matched route pattern are also included in the `props` argument of the component as:
	 *
	 * - `id` the matched non empty named path step
	 * - `$` the matched trailing path
	 */
	readonly [pattern: string]: FunctionComponent<any> | string;

}

/**
 * Routing store.
 */
export interface Store {

	/**
	 * Converts browser location to a route.
	 *
	 * @returns the current route as extracted from the current browser location
	 */
	(): string;

	/**
	 * Converts a route to a browser location.
	 *
	 * @param route the route to be converted
	 *
	 * @returns a location-relative string representing `route`
	 */
	(route: string): string;

}


/**
 * App router.
 */
export interface Router {

	name(label?: string): string;


	/**
	 * Creates an attribute spread for active links.
	 *
	 * @param route the target link route; may include a trailing `*` to match nested routes
	 *
	 * @return an attribute spread including an `href` attribute for `route` and an optional `active` boolean
	 * attribute if `route` matches the {@link peek current route}
	 */
	active(route: string): { href: string, [ActiveAttribute]?: "" };

	/**
	 * Creates an attribute spread for native links.
	 *
	 * @param route the target link route
	 *
	 * @return an attribute spread including an `href` attribute for `route` and an `native` boolean atribute
	 */
	native(route: string): { href: string, [NativeAttribute]?: "" };


	/**
	 * Retrieves the current route.
	 *
	 * @return the current route
	 */
	peek(): string;

	push(route: string, state?: any): void;

	swap(route: string, state?: any): void;

	back(): void;


	link(): boolean;

	link(route: string, linker: Linker): void;

	link(dry: boolean, frames: Frame[]): boolean;

	link(nil: null): void;

}

export interface Linker {

	(dry: boolean, frames: Frame[]): boolean;

}


//// Stores ////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates a path {@link Store route store}
 *
 * @return a function managing routes as relative-relative paths including search and hash
 */
export function path(): Store {
	return (route?: string) => route === undefined
		? location.href.startsWith(base) ? location.pathname : location.href
		: route ? `${base}${route.startsWith("/") ? route.substr(1) : route}` : location.href;
}

/**
 * Creates a hash {@link Store route store}
 *
 * @return a function managing routes as hashes
 */
export function hash(): Store {
	return (route?: string) => route === undefined
		? location.hash.substring(1)
		: route ? route.startsWith("#") ? route : `#${route}` : location.hash;
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function useRouter(): Router {
	return useContext(RouterContext);
}

export function ToolRouter({

	store=path(),

	routes

}: {

	routes: Table | Switch

	/**
	 * The route store
	 *
	 * @default {@link path()}
	 */
	store?: Store

}) {

	const [, update]=useReducer(v => v+1, 0);

	const selector=useMemo(() => routes instanceof Function ? routes : compile(routes), []);

	const [linking, setLinking]=useState<{

		route: string
		cache: ReactElement

		linker: Linker

	}>();

	useEffect(() => {

		window.addEventListener("popstate", update);
		window.addEventListener("click", click);

		return () => {
			window.removeEventListener("popstate", update);
			window.removeEventListener("click", click);
		};

	}, []);


	function click(e: MouseEvent) {
		if ( !(e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || e.defaultPrevented) ) { // only plain events

			const anchor=(e.target as Element).closest("a");

			if ( anchor
				&& anchor.getAttribute(NativeAttribute) === null // only non-native anchors
				&& anchor.getAttribute(TargetAttibute) === null // only local anchors
			) {

				const href=anchor.href;
				const file="file:///";

				const route=href.startsWith(base) ? href.substr(base.length-1)
					: href.startsWith(root) ? href.substr(root.length-1)
						: href.startsWith(file) ? href.substr(file.length-1)
							: "";

				if ( route ) { // only internal routes

					history.pushState(history.state, document.title, store(route));

					update();

					e.preventDefault();

				}
			}
		}
	}


	let route=store();

	const redirects=new Set([route]);

	while ( true ) {

		const component=selector(route);

		if ( typeof component === "string" ) {

			if ( redirects.has(component) ) {
				throw new Error(`cyclic redirection <${Array.from(redirects)}>`);
			}

			redirects.add(route=component);

		} else { // ;( no useEffect() / history must be updated before component is rendered

			history.replaceState(history.state, document.title, store(route)); // possibly altered by redirections

			document.title=join(label(route), name); // !!! update history

			const delegate=router({ store, update });

			return createElement(RouterContext.Provider, {

				value: {

					...delegate,

					link(first?: null | string | boolean, second?: Linker | Frame[]): any {
						if ( first === undefined ) { // linking?

							return linking !== undefined;

						} else if ( typeof first === "string" ) { // start linking

							if ( linking ) {
								throw new Error("linking site already active");
							}

							const route=first;
							const linker=second as Linker;

							setLinking({

								route: store(),
								cache: component,

								linker: linker

							});

							delegate.swap(route);

						} else if ( typeof first === "boolean" ) { // link

							const dry=first;
							const frames=second as Frame[];

							if ( linking && !dry ) {

								setLinking(undefined);

								delegate.swap(linking.route);

							}

							return linking && frames.length && linking.linker(dry, frames);

						} else if ( first === null ) { // stop linking

							if ( linking ) {

								setLinking(undefined);

								delegate.swap(linking.route);

							}

						}
					}

				},

				children: [
					createElement("tool-source", { key: "source" }, linking?.cache && component),
					createElement("tool-target", { key: "target" }, linking?.cache || component)
				]

			});

		}

	}

}


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function join(label: string, title: string, separator: string=" | "): string {
	return `${label}${label && title ? separator : ""}${title}`;
}

function compile(table: Table): Switch {

	function pattern(glob: string): string { // convert a glob pattern to a regular expression
		return glob === "*" ? "^.*$" : `^${glob

			.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&") // escape special regex characters
			.replace(/\\{(\w+)\\}/g, "(?<$1>[^/]+)") // convert glob named parameters
			.replace(/\\{\\}/g, "(?:[^/]+)") // convert glob anonymous parameters
			.replace(/\/\\\*$/, "(?<$>/.*)") // convert glob trailing path

		}([?#].*)?$`; // ignore trailing query/hash
	}

	const patterns: { [pattern: string]: FunctionComponent | string }={};

	for (const glob of Object.keys(table)) {
		patterns[pattern(glob)]=table[glob];
	}

	return route => {

		const entries: [string, FunctionComponent | string][]=Object
			.entries(patterns);

		const matches: [RegExpExecArray | null, FunctionComponent | string][]=entries
			.map(([pattern, component]) => [new RegExp(pattern).exec(route), component]);

		const [match, delegate]: [RegExpExecArray | null, FunctionComponent | string]=matches
			.find(([match]) => match !== null) || [null, () => null];

		if ( typeof delegate === "string" ) {

			return delegate.replace(/{(\w*)}|\/\*$/g, ($0, $1) => // replace wildcard references
				$0 === "/*" ? match?.groups?.$ || ""
					: $1 ? match?.groups?.[$1] || ""
						: route
			);

		} else {

			return createElement(delegate, { ...match?.groups });

		}

	};

}

function router({ store, update }: { store: Store, update: () => void }) {
	return {

		name(label?: string): string {
			return label === undefined ? name : (document.title=join(label, name)); // !!! update history
		},


		active(route: string): { href: string, [ActiveAttribute]?: "" } {

			const wild=route.endsWith("*");

			const href=wild ? route.substr(0, route.length-1) : route;

			function matches(target: string, current: string) {
				return wild ? current.startsWith(target) : current === target;
			}

			return { href: href, [ActiveAttribute]: matches(href, store()) ? "" : undefined };

		},

		native(route: string): { href: string, [NativeAttribute]?: "" } {
			return { href: route, [NativeAttribute]: "" };
		},


		peek(): string {
			return store();
		},

		push(route: string, state?: any): void {

			const updateState=(route === store()) ? history.replaceState : history.pushState;

			try { updateState(state, document.title, store(route));} finally { update();}
		},

		swap(route: string, state?: any): void {

			const updateState=history.replaceState;

			try { updateState(state, document.title, store(route)); } finally { update(); }
		},

		back(): void {
			history.back();
		},


		link(first?: null | string | boolean, second?: Linker | Frame[]): any {
			return false;
		}

	};
}
