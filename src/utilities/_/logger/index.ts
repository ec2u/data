/*
 * Copyright © 2025 Metreeca srl
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

import { immutable, isArray, isFunction, isObject, isString } from "@metreeca/core";


const buildDirs = new Set(["dist", "lib", "build", "out"]);


let bindings: readonly Sink[] = [];


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Level priority for filtering log messages.
 */
export enum Level {
	debug = 0,
	info = 1,
	warning = 2,
	error = 3
}


export interface Feed {

	readonly level?: Level; // minimum logging level

	readonly pipe?: Pipe | readonly Pipe[]; // sink preprocessing ; must be applied in reverse order to sinks to be fed
	readonly sink?: string | readonly string[]; // sink to be fed; no sinks if undefined

}

export interface Pipe {

	(sink: Sink): Sink;

}

export interface Sink {

	(path: string, level: Level, message: TemplateStringsArray, values: unknown[]): void;

}

export interface Spec {

	readonly [name: string]: Feed | Sink;

}


export interface Logger {

	(path: Function): Logger;

	(...path: string[]): Logger;


	debug(message: TemplateStringsArray, ...values: unknown[]): Logger;

	info(message: TemplateStringsArray, ...values: unknown[]): Logger;

	warning(message: TemplateStringsArray, ...values: unknown[]): Logger;

	error(message: TemplateStringsArray, ...values: unknown[]): Logger;

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function log(...path: string[]): Logger;
export function log(...spec: readonly Spec[]): void;

export function log(...x: readonly unknown[]): unknown {

	if ( isArray(x, isString) ) { // create logger

		const path = normalize(x);

		const logger = immutable(Object.assign((...args: [Function] | string[]): Logger => {

			// chain additional path segments to create a new logger

			return log(...x, ...(args.length === 1 && isFunction(args[0])
					? [args[0].name || "anonymous"]
					: args as string[]
			));

		}, {

			debug(message: TemplateStringsArray, ...values: unknown[]): Logger {
				return emit(Level.debug, message, ...values);
			},

			info(message: TemplateStringsArray, ...values: unknown[]): Logger {
				return emit(Level.info, message, ...values);
			},

			warning(message: TemplateStringsArray, ...values: unknown[]): Logger {
				return emit(Level.warning, message, ...values);
			},

			error(message: TemplateStringsArray, ...values: unknown[]): Logger {
				return emit(Level.error, message, ...values);
			}

		})) satisfies Logger;

		function emit(level: Level, message: TemplateStringsArray, ...values: unknown[]): Logger {

			bindings.forEach(sink => sink(path, level, message, values));

			return logger;

		}

		return logger;

	} else { // update setup

		const spec = x as readonly Spec[];

		const feeds: { readonly [name: string]: Feed } = Object.fromEntries(spec
			.flatMap(Object.entries)
			.filter(([, port]) => isObject(port))
		);

		const sinks: { readonly [name: string]: Sink } = Object.fromEntries(spec
			.flatMap(Object.entries)
			.filter(([, port]) => isFunction(port))
		);

		bindings = compile(feeds, sinks);

		return;

	}

}


export function simple(): Sink {

	const loggers = [console.debug, console.info, console.warn, console.error];
	const prefixes = ["?", "!", "!!", "!!!"];

	return (path: string, level: Level, message: TemplateStringsArray, values: unknown[]) => {

		const prefix = prefixes[level];
		const logger = loggers[level];
		const context = path.split("/").at(-2) || "";

		// note: values are already resolved (functions executed) by the wrapper sink
		const text = String.raw(message, ...values);

		logger("%s %s %s",
			prefix.padStart(3),
			context.padEnd(15),
			text
		);

	};
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * @internal
 *
 * @param head
 * @param tail
 * @param root
 */
export function normalize([head, ...tail]: readonly string[], root = "src"): string {
	if ( head && /^(file|https?):\/\//.test(head) ) {

		const segments = new URL(head).pathname.split("/").filter(Boolean);
		const modules = segments.indexOf("node_modules");

		const base = modules >= 0
			? pkg(segments, modules)
			: prj(segments, root);

		return tail.length > 0
			? `${base}/${tail.join("/")}/`
			: `${base}/`;

	} else {

		return head !== undefined
			? `${[head, ...tail].join("/")}/`
			: "/";

	}
}


function pkg(segments: string[], modules: number): string {

	const packageSegments = segments.slice(modules+1);
	const scoped = packageSegments[0]?.startsWith("@");
	const packageEnd = scoped ? 2 : 1;
	const packageParts = packageSegments.slice(0, packageEnd);
	const packageName = packageParts.join("/");
	const lastName = packageParts[packageParts.length-1];

	const skipBuild = buildDirs.has(packageSegments[packageEnd]) ? 1 : 0;

	const subpath = packageSegments
		.slice(packageEnd+skipBuild)
		.map(clean)
		.filter(s => s !== "index" && s !== lastName);

	return subpath.length === 0 ? packageName
		: `${packageName}/${subpath.join("/")}`;

}

function prj(segments: string[], root: string): string {

	const rootIndex = segments.indexOf(root);

	return segments
		.slice(rootIndex >= 0 ? rootIndex+1 : segments.length-2)
		.map(clean)
		.join("/");

}


function clean(path: string) {
	return path.replace(/(?:\.\w+)*\/*$/, "");
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Compiles feeds and sinks into an array of sink functions.
 *
 * @internal
 *
 * @param feeds - Map of feed names to feed configurations
 * @param sinks - Map of sink names to sink functions
 * @returns Array of compiled sink functions
 * @throws Error if a feed references an undefined sink
 */
export function compile(
	feeds: { readonly [name: string]: Feed },
	sinks: { readonly [name: string]: Sink }
): Sink[] {

	return Object.entries(feeds).flatMap(([feedPath, feed]) => {

		const expanded = expand(feedPath, feed, feeds);
		const children = Object.keys(feeds).filter(p => p !== feedPath && p.startsWith(feedPath));

		// determine which sinks this feed targets (deduplicate)

		const names: readonly string[] = expanded.sink === undefined ? []
			: Array.from(new Set(isString(expanded.sink) ? [expanded.sink] : expanded.sink));

		// validate that all referenced sinks exist and wrap with path filter

		return names.map((name: string) => {

			if ( !(name in sinks) ) {
				throw new Error(`undefined sink "${name}" referenced from feed "${feedPath}"`);
			}

			const minLevel = expanded.level;

			// apply pipes to wrap the sink if any are configured
			// pipes are applied in reverse order: last pipe wraps sink, first pipe is outermost

			const sink = expanded.pipe === undefined ? sinks[name]
				: Array.isArray(expanded.pipe)
					? expanded.pipe.reduceRight((sink: Sink, pipe: Pipe) => pipe(sink), sinks[name])
					: (expanded.pipe as Pipe)(sinks[name]);

			// return a wrapper sink that filters by path prefix and level
			// includes child feed check captured at compile time

			return (path: string, level: Level, message: TemplateStringsArray, values: unknown[]): void => {

				if ( (minLevel === undefined || level >= minLevel)
					&& path.startsWith(feedPath)
					&& !children.some(childPath => path.startsWith(childPath))
				) {

					// execute any function values only when actually forwarding to sink
					sink(path, level, message, values.map(v => typeof v === "function" ? v() : v));

				}

			};

		});

	});

}

function expand(path: string, feed: Feed, feeds: { [path: string]: Feed }) {

	function normalize(f: Feed) {
		return {
			level: f.level,
			sink: f.sink === undefined ? [] : Array.isArray(f.sink) ? f.sink : [f.sink],
			pipe: f.pipe === undefined ? [] : Array.isArray(f.pipe) ? f.pipe : [f.pipe]
		};
	}

	const parents = Object.entries(feeds)
		.filter(([p]) => p !== path && path.startsWith(p))
		.sort(([p], [b]) => p.split("/").length-b.split("/").length)
		.map(([, config]) => normalize(config));


	// inherit from parent feeds (shortest paths first)

	return parents.concat(normalize(feed)).reduce((base, override) => ({

		level: override.level ?? base.level,

		sink: [...base.sink, ...override.sink],
		pipe: [...base.pipe, ...override.pipe]

	}), normalize({}));

}
