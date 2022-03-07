/*
 * Copyright © 2020-2022 Metreeca srl
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

import { Immutable, Optional } from "@ec2u/data/client/@metreeca/core";


export type Blank={

	readonly [field: string]: never;

}


export interface Graph {

	get<F extends Frame=Frame, E extends Error=Error>(id: string, model: F, query?: Query): Entry<typeof model, E>;


	post<E extends Error=Error>(id: string, state: State): Entry<Frame, E>;

	put<E extends Error=Error>(id: string, state: State): Entry<Frame, E>;

	delete<E extends Error=Error>(id: string): Entry<Frame, E>;


	observe(id: string, observer: () => void): () => void;

}

export interface Entry<F extends Frame=Frame, E extends Error=Error> {

	(): Optional<F>;

	<R>(probe: (frame: F) => Optional<R>): Optional<R>;

	<R>(probe: Probe<F, E, R>): Optional<R>;

}

export interface EntryUpdater { // !!! review return values

	<E extends Error=Error>(state: State): Entry<{ id: string }, E>; // post

	<E extends Error=Error>(state: Frame): Entry<{ id: string }, E>; // put

	<E extends Error=Error>(blank: Blank): Entry<{ id: string }, E>; // delete

}

export interface Probe<F extends Frame, E extends Error, R> {

	fetch?: R | ((abort: () => void) => Optional<R>);

	frame?: R | ((frame: F) => Optional<R>);

	error?: R | ((error: E) => Optional<R>);

}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export type Multi=undefined | Value | Immutable<Value[]>;
export type Value=Plain | Langs | Frame
export type Plain=boolean | number | string

export interface Langs {

	readonly [lang: string]: string;

}

export interface Frame extends State {

	readonly id: string;

}


export function required<T=any>(value: T): typeof value {
	return value;
}

export function optional<T=any>(value: T): undefined | typeof value {
	return value;
}

export function repeatable<T=any>(value: T[]): typeof value {
	return value;
}

export function multiple<T=any>(value: T[]): undefined | typeof value {
	return value;
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export interface State {

	readonly [field: string]: Multi;

}

export interface Error<S extends State=State> {

	readonly status: number;
	readonly reason: string;

	readonly detail: S;

}


export interface Query {

	readonly ".links"?: string;
	readonly ".terms"?: string;
	readonly ".stats"?: string;

	readonly ".order"?: string | Immutable<string[]>;
	readonly ".offset"?: number;
	readonly ".limit"?: number;

	readonly [path: string]: undefined | Plain | Immutable<Plain[]>;

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function array(field: Multi): field is Immutable<Value[]> {
	return Array.isArray(field);
}

export function plain(field: Multi): field is Plain {
	return typeof field === "boolean" || typeof field === "number" || typeof field === "string";
}

export function langs(field: Multi): field is Langs {
	return typeof field === "object" && !("id" in field);
}

export function frame(field: Multi): field is Frame {
	return typeof field === "object" && "id" in field;
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function id(frame: Frame): string {
	return frame.id;
}

export function label(frame: Frame, locales: readonly string[]=navigator.languages) {
	return string(frame.label, locales) || guess(frame.id) || "";
}

export function local(langs: Langs, locales: readonly string[]=navigator.languages) {
	return locales.map(l => langs[l]).filter(s => s)[0] || langs.en || Object.values(langs)[0] || "";
}

export function value(field: Multi): Optional<Value> {
	return array(field) ? undefined : field;
}

export function string(multi: Optional<Multi>, locales: readonly string[]=navigator.languages): string {
	return typeof multi === "boolean" ? multi.toString()
		: typeof multi === "number" ? multi.toLocaleString(locales as string[])
			: typeof multi === "string" ? multi
				: frame(multi) ? label(multi, locales)
					: langs(multi) ? local(multi, locales)
						: "";
}


/**
 * Guesses a resource label from its id.
 *
 * @param id the resource id
 *
 * @returns a label guessed from `id` or an empty string, if unable to guess
 */
export function guess(id: string): string {
	return id
		.replace(/^.*?(?:[/#:]([^/#:]+))?(?:\/|#|#_|#id|#this)?$/, "$1") // extract label
		.replace(/([a-z-0-9])([A-Z])/g, "$1 $2") // split camel-case words
		.replace(/[-_]+/g, " ") // split kebab-case words
		.replace(/\b[a-z]/g, $0 => $0.toUpperCase()); // capitalize words
}


/**
 * Merges an id and an optional query into an URL.
 *
 * @param id
 * @param query
 *
 * @return
 */
export function url(id: string, query?: Query) {

	function clean(value: any): any {
		return array(value) ? value.length && value.map(clean).filter(v => v !== undefined)
			: value ? value
				: undefined;
	}

	if ( query ) {

		const search: any={};

		Object.getOwnPropertyNames(query || {}).forEach(key => {

			const value=clean(query[key]);

			if ( key.startsWith(".") ? value : value !== undefined ) {
				search[key]=value;
			}

		});

		return Object.getOwnPropertyNames(search).length
			? `${id}?${encodeURIComponent(JSON.stringify(search))}`
			: id;

	} else {

		return id;

	}
}
