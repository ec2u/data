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


export type Primitive=undefined | null | boolean | string | number | Function

export type Immutable<T>=
	T extends Primitive ? T
		: T extends Array<infer U> ? ReadonlyArray<Immutable<U>>
			: { readonly [K in keyof T]: Immutable<T[K]> }


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export interface Graph {

	get<F extends Frame=Frame, E extends Error=Error>(id: string, model: F, query?: Query): Entry<typeof model, E>;


	post<E extends Error=Error>(id: string, state: State): Entry<Frame, E>;

	put<E extends Error=Error>(id: string, state: State): Entry<Frame, E>;

	delete<E extends Error=Error>(id: string): Entry<Frame, E>;


	observe(id: string, observer: () => void): () => void;

}

export interface Entry<F extends Frame=Frame, E extends Error=Error> {

	blank<V>(mapper: () => undefined | V): undefined | V; // first fetch | error | deleted

	fetch<V>(mapper: (abort: () => void) => undefined | V): undefined | V;


	frame<V>(mapper: (frame: F) => undefined | V): undefined | V;

	error<V>(mapper: (error: E) => undefined | V): undefined | V;

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export type Field=undefined | Value | Immutable<Value[]>;
export type Value=Plain | Langs | Frame
export type Plain=boolean | number | string

export interface Langs {

	readonly [lang: string]: string;

}

export interface Frame extends State {

	readonly id: string;

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export interface Blank {

	readonly [field: string]: never;

}

export interface State {

	readonly [field: string]: Field;

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

export interface Error<S extends State=State> {

	readonly status: number;
	readonly reason: string;

	readonly detail: S;

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function array(field: Field): field is Immutable<Value[]> {
	return Array.isArray(field);
}

export function plain(field: Field): field is Plain {
	return typeof field === "boolean" || typeof field === "number" || typeof field === "string";
}

export function langs(field: Field): field is Langs {
	return typeof field === "object" && !("id" in field);
}

export function frame(field: Field): field is Frame {
	return typeof field === "object" && "id" in field;
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function value(field: Field): undefined | Value {
	return array(field) ? undefined : field;
}

export function string(field: undefined | Field, locales: readonly string[]=navigator.languages): string {
	return typeof field === "boolean" ? field.toString()
		: typeof field === "number" ? field.toLocaleString(locales as string[])
			: typeof field === "string" ? field
				: frame(field) ? string(field.label, locales) || label(field.id) || ""
					: langs(field) ? locales.map(l => field[l]).filter(s => s)[0] || field.en || Object.values(field)[0] || ""
						: "";
}

/**
 * Guesses a resource label from its id.
 *
 * @param id the resource id
 *
 * @returns a label guessed from `id` or an empty string, if unable to guess
 */
export function label(id: string) {
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


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function freeze<T=any>(value: T): Immutable<typeof value> {
	if ( typeof value === "object" ) {

		return Object.freeze(Object.getOwnPropertyNames(value as any).reduce((object: any, key) => {

			object[key]=freeze((value as any)[key]);

			return object;

		}, Array.isArray(value) ? [] : {}));

	} else {

		return value as any;

	}
}
