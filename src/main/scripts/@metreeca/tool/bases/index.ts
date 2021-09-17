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

import { ReactNode } from "react";
import { Immutable } from "../index";

export type Entry<V extends Frame=Frame, E extends Error=Error>=Blank | V | E

export interface Blank {

	readonly [field: string]: never;

}

export interface Error {

	readonly status: number;
	readonly reason: string;

	readonly detail: any;

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

export interface State {

	readonly type?: string;
	readonly image?: string;
	readonly label?: string | Langs;
	readonly comment?: string | Langs;

	readonly [field: string]: Field;

}

export interface Query {

	readonly ".terms"?: string; // !!! items
	readonly ".stats"?: string; // !!! range

	readonly ".order"?: string | Immutable<string[]>;
	readonly ".offset"?: number;
	readonly ".limit"?: number;

	readonly [path: string]: undefined | Plain | Immutable<Plain[]>;

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export interface Graph {

	get<V extends Frame=Frame>(id: string, model: V, query?: Query): Promise<typeof model>;


	post(id: string, state: State): Promise<string>; // rejected with Error

	put(id: string, state: State): Promise<void>; // rejected with Error

	delete(id: string): Promise<void>; // rejected with Error


	observe(id: string, model: Frame, observer: (frame?: typeof model) => void): () => void;

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function blank(value: Field | State | Entry): value is Blank {
	return typeof value === "object" && Object.keys(value).length === 0;
}

export function error(value: Field | State | Entry): value is Error {
	return typeof value === "object" && "status" in value && "reason" in value && "detail" in value;
}


export function plain(value: Field | State | Entry): value is Plain {
	return typeof value === "boolean" || typeof value === "number" || typeof value === "string";
}

export function langs(value: Field | State | Entry): value is Langs {
	return typeof value === "object" && !("id" in value);
}

export function frame(value: Field | State | Entry): value is Frame {
	return typeof value === "object" && "id" in value;
}

export function array(value: Field | State | Entry): value is Immutable<Value[]> {
	return Array.isArray(value);
}


export function probe<V extends Frame=Frame, E extends Error=Error>(entry: Entry<V, E>, cases: {

	blank?: ReactNode | (() => ReactNode)
	frame?: ReactNode | ((frame: V) => ReactNode)
	error?: ReactNode | ((error: E) => ReactNode)

}) {
	return blank(entry) ? typeof cases.blank === "function" ? cases.blank() : cases.blank
		: frame(entry) ? typeof cases.frame === "function" ? cases.frame(entry) : cases.frame
			: error(entry) ? typeof cases.error === "function" ? cases.error(entry) : cases.error
				: undefined;

}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function string(value: undefined | Value, locales: string[]=["en"]): string {
	return typeof value === "boolean" ? value.toString()
		: typeof value === "number" ? value.toLocaleString()
			: typeof value === "string" ? value
				: frame(value) ? string(value.label || "", locales) || label(value.id)
					: langs(value) ? locales.map(locale => value[locale]).filter(string => string)[0] || ""
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
