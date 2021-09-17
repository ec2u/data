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

/**
 * Creates a conditional `className` attribute spread.
 *
 * @param classes
 *
 * @return
 */
export function classes(classes: { [name: string]: boolean }): { className: string } {
	return {
		className: Object.entries(classes)
			.filter(entry => entry[1])
			.map(entry => entry[0])
			.join(" ")
	};
}

export function normalize(text: string): string {
	return text.trim().replace(/\s+/g, " ");
}

/**
 * Creates a regular expression matching a set of stemmed keywords.
 *
 * @param keywords the keywords to be matched
 *
 * @returns a regular expression matching the word stems in `keywords` ignoring case and non-word characters
 */
export function like(keywords: string): RegExp {
	return new RegExp((keywords.match(/\w+/g) || [])
		.reduce((pattern, stem) => `${pattern}\\b${stem}.*`, ".*"), "i");
}


/**
 * Reports unhandled errors
 *
 * @param message
 */
export function report(message: string): void {

	const color=document.body.style.backgroundColor;

	document.body.style.backgroundColor="red";

	setTimeout(() => document.body.style.backgroundColor=color, 300);
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
