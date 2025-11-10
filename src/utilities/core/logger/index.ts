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


const roots = new Set(["dist", "lib", "build", "out"]);


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


let bindings: readonly Sink[] = compile({

	console: simple(),

	"/@/": { level: "info", sink: "console" } // default configuration for loggers in the local codebase

});


export interface Feed {

	readonly level?: Level | keyof typeof Level; // minimum logging level

	readonly pipe?: Pipe | readonly Pipe[]; // sink preprocessing ; must be applied in reverse order to sinks to be fed
	readonly sink?: string | readonly string[]; // sink to be fed; no sinks if undefined

}

export interface Pipe {

	(sink: Sink): Sink;

}

export interface Sink {

	(path: string, level: Level, message: TemplateStringsArray, values: unknown[]): boolean;

}

export interface Opts {

	readonly [name: string]: Feed | Sink | Level | keyof typeof Level;

}


export interface Logger {

	(path: Function): Logger; // creat a new logger for a function using its name as an additional path segment

	(...path: string[]): Logger; // chain additional path segments to create a new logger



	debug(message: TemplateStringsArray, ...values: unknown[]): Logger;

	info(message: TemplateStringsArray, ...values: unknown[]): Logger;

	warning(message: TemplateStringsArray, ...values: unknown[]): Logger;

	error(message: TemplateStringsArray, ...values: unknown[]): Logger;

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function log(...path: readonly string[]): Logger;
export function log(...opts: readonly Opts[]): void;

export function log(...a: readonly unknown[]): unknown {

	return isArray(a, isString)
		? logger(a)
		: (bindings = compile(...a as readonly Opts[]));

}


export function simple(): Sink {

	const loggers = [console.debug, console.info, console.warn, console.error];
	const prefixes = ["?", "!", "!!", "!!!"];

	return (path: string, level: Level, message: TemplateStringsArray, values: unknown[]) => {

		const prefix = prefixes[level];
		const logger = loggers[level];
		const context = path.split("/").at(-2) || "";

		const text = String.raw(message, ...values);

		logger("%s %s %s",
			prefix.padStart(3),
			context.padEnd(20),
			text
		);

		return true;

	};
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function logger(segments: string[]): Logger {

	const path = normalize(segments);

	const logger = immutable(Object.assign((...args: [Function] | string[]): Logger => {

		return log(...segments, ...(args.length === 1 && isFunction(args[0])
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

		bindings.find(sink => sink(path, level, message, values));

		return logger;

	}

	return logger;
}

/**
 * @internal
 *
 * Normalizes path segments into a canonical logger path.
 *
 * **Process:**
 *
 * **If first segment (head) matches URL pattern** (file://, http://, https://):
 *
 * - Parse URL and extract pathname
 * - Split pathname into segments
 *
 * - **If "node_modules" found in path** (imported code):
 *
 *   - Extract package identifier: 1 segment for regular packages (e.g., "lodash"),
 *     2 for scoped (e.g., "@scope/pkg")
 *   - Skip build directory (dist, lib, build, out) if present after package identifier
 *   - Clean module path segments (see Cleaning below)
 *   - Filter out redundant package name occurrences (e.g., "@scope/pkg/pkg/utils" → "@scope/pkg/utils")
 *   - Combine package identifier with cleaned module path
 *
 * - **Otherwise** (exported code):
 *
 *   - Clean all segments (see Cleaning below)
 *   - Search for root directory in cleaned segments:
 *     - **If root found**: Take all segments after it
 *     - **Otherwise**: Take only the last segment
 *   - Prefix result with "@" marker
 *
 * - Clean tail segments and append to base (see Cleaning below)
 * - Join all segments with "/" (leading and trailing slashes)
 *
 * **Otherwise** (plain path):
 *
 * - Combine head and tail
 * - Clean combined segments (see Cleaning below)
 * - Join with "/" (leading and trailing slashes)
 *
 * **Cleaning:**
 *
 * - Splits segments on "/"
 * - Removes file extensions and trailing slashes
 * - Filters out empty segments and "index" segments
 *
 * @param head First path segment (possibly a URL)
 * @param tail Additional path segments to append
 * @param root Root directory name for project code (default: "src")
 *
 * @returns Normalized path with leading and trailing "/" (or just "/" for root):
 *
 *   - Exported code starts with "@" (e.g., `/@/utilities/logger/`)
 *   - Imported code starts with package identifier (e.g., `/lodash/map/` or `/@scope/pkg/utils/`)
 *   - All segments are cleaned as described above
 */
export function normalize([head, ...tail]: readonly string[], root = "src"): string {
	if ( head && /^(file|https?):\/\//.test(head) ) {

		const segments = new URL(head).pathname.split("/");
		const modules = segments.indexOf("node_modules");

		const base = modules >= 0
			? imported(segments.slice(modules+1))
			: exported(segments, root);

		return join([...base, ...clean(tail)]);

	} else {

		return join(head === undefined ? [] : clean([head, ...tail]));

	}
}


function imported(segments: string[]): readonly string[] {

	const scoped = segments[0]?.startsWith("@");
	const module = scoped ? 2 : 1;

	const packageId = segments.slice(0, module); // package id (e.g., "pkg" or "@scope/core")
	const packageName = packageId.at(-1)!; // last part of package id (e.g., "core" from "@scope/core")

	return [...packageId, ...clean(segments
		.slice(module+(roots.has(segments[module]) ? 1 : 0)) // skip build directory after package name
		.filter(s => s !== packageName) // remove redundant package name from module path
	)];

}

/**
 * Builds project-relative path segments with "@" prefix.
 *
 * When root directory is found, returns all segments after it.
 * Otherwise, returns only the last segment as a fallback.
 *
 * @param segments Path segments to process
 * @param root Root directory name to search for (typically "src")
 *
 * @returns Array starting with "@" followed by cleaned path segments
 */
function exported(segments: string[], root: string): readonly string[] {

	const cleaned = clean(segments);
	const codebase = cleaned.indexOf(root);

	return ["@", ...cleaned.slice(codebase >= 0 ? codebase+1 : -1)];
}


/**
 * Cleans and filters path segments.
 *
 * Splits segments on "/", removes file extensions and trailing slashes,
 * filters out empty segments and "index" segments.
 *
 * @param segments Path segments to clean
 *
 * @returns Filtered array of cleaned segments
 */
function clean(segments: readonly string[]): readonly string[] {
	return segments
		.flatMap(s => s.split("/"))
		.map(s => s.replace(/(?:\.\w+)*\/*$/, ""))
		.filter(s => s && s !== "index");
}

/**
 * Joins segments into a normalized path string.
 *
 * @param segments Path segments to join
 *
 * @returns Normalized path string with leading and trailing slashes; "/" for empty arrays
 */
function join(segments: readonly string[]): string {
	return segments.length > 0
		? `/${segments.join("/")}/`
		: "/";
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Compiles feeds and sinks into an array of sink functions.
 * Sinks are sorted by feed path specificity (most specific first) to enable efficient
 * early termination when logging - eliminating the quadratic children check.
 *
 * @param feeds - Map of feed names to feed configurations
 * @param sinks - Map of sink names to sink functions
 *
 * @returns Array of compiled sink functions, sorted by feed path specificity (descending)
 *
 * @thros Error if a feed references an undefined sink
 */
function compile(...opts: readonly Opts[]) {

	const feeds: { readonly [name: string]: Feed } = Object.fromEntries((opts as readonly Opts[])
		.flatMap(Object.entries)
		.map(([name, port]) =>
			typeof port === "number" ? [name, { level: port }]
				: typeof port === "string" ? [name, { level: Level[port as keyof typeof Level] }]
					: [name, port]
		)
		.filter(([, port]) => isObject(port))
	);

	const sinks: { readonly [name: string]: Sink } = Object.fromEntries((opts as readonly Opts[])
		.flatMap(Object.entries)
		.filter(([, port]) => isFunction(port))
	);

	// sort feeds by path depth (most specific first)
	// paths are guaranteed to end with /, so split/filter gives component count

	return Object.entries(feeds)
		.sort(([x], [y]) => depth(y)-depth(x))
		.map(([feedPath, feed]) => {

			const expanded = expand(feedPath, feed, feeds);

			// determine which sinks this feed targets (deduplicate)

			const names: readonly string[] = expanded.sink === undefined ? []
				: Array.from(new Set(isString(expanded.sink) ? [expanded.sink] : expanded.sink));

			// validate and collect target sinks for this feed

			const targets: Sink[] = names.map((name: string) => {

				if ( !(name in sinks) ) {
					throw new Error(`undefined sink "${name}" referenced from feed "${feedPath}"`);
				}

				// apply pipes to wrap the sink if any are configured
				// pipes are applied in reverse order: last pipe wraps sink, first pipe is outermost

				return expanded.pipe === undefined ? sinks[name]
					: Array.isArray(expanded.pipe)
						? expanded.pipe.reduceRight((sink: Sink, pipe: Pipe) => pipe(sink), sinks[name])
						: (expanded.pipe as Pipe)(sinks[name]);

			});

			const minLevel = typeof expanded.level === "string"
				? Level[expanded.level as keyof typeof Level]
				: expanded.level;

			// return a single wrapper that handles all sinks for this feed level

			return (path: string, level: Level, message: TemplateStringsArray, values: unknown[]): boolean => {

				if ( path.startsWith(feedPath) ) {

					if ( minLevel === undefined || level >= minLevel ) {

						if ( targets.length ) {

							// execute any function values only when actually forwarding to sinks

							const resolved = values.map(v => typeof v === "function" ? v() : v);

							// call all target sinks for this feed

							targets.forEach(sink => sink(path, level, message, resolved));
						}

					}

					return true; // path matched - stop searching regardless of level

				}

				return false; // path didn't match - keep searching

			};

		});

}

function expand(path: string, feed: Feed, feeds: { [path: string]: Feed }): Feed {

	function normalize(f: Feed) {
		return {
			level: f.level,
			sink: f.sink === undefined ? [] : Array.isArray(f.sink) ? f.sink : [f.sink],
			pipe: f.pipe === undefined ? [] : Array.isArray(f.pipe) ? f.pipe : [f.pipe]
		};
	}

	const parents = Object.entries(feeds)
		.filter(([p]) => p !== path && path.startsWith(p))
		.sort(([p], [b]) => depth(p)-depth(b))
		.map(([, config]) => normalize(config));


	// inherit from parent feeds (shortest paths first)

	return parents.concat(normalize(feed)).reduce((base, override) => ({

		level: override.level ?? base.level,

		sink: [...base.sink, ...override.sink],
		pipe: [...base.pipe, ...override.pipe]

	}), normalize({}));

}


function depth(p: string) { return p.split("/").length; }
