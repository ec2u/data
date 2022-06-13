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

import { immutable, Immutable, isArray, isBoolean, isNumber, isObject, isString } from "@metreeca/core";


export interface Graph {

    get<V extends Frame, E extends Frame>(id: string, model: V, query?: Query): State<V, E>;

    post<V extends Frame, E extends Frame>(id: string, frame: V, probe: Probe<Focus, E>): void;

    put<V extends Frame, E extends Frame>(id: string, frame: V, probe: Probe<Focus, E>): void;

    del<E extends Frame>(id: string, probe: Probe<Focus, E>): void;


    observe(id: string, observer: () => void): () => void;

}

export interface State<V extends Frame, E extends Frame=Frame> {

    <R>(probe: Probe<V, E, R>): undefined | R;

}

export interface Probe<V, E extends Frame=Frame, R=void> {

    fetch?: R | ((abort: () => void) => R);

    value?: R | ((frame: V) => R);

    error?: R | ((error: Error<E>) => R);

    other?: R | ((state: (() => void) | V | Error<E>) => R);

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export interface Query {

    readonly ".links"?: string;
    readonly ".terms"?: string;
    readonly ".stats"?: string;

    readonly ".order"?: string | Immutable<string[]>;
    readonly ".offset"?: number;
    readonly ".limit"?: number;

    readonly [path: string]: undefined | Literal | Immutable<Literal[]>;

}

export interface Focus {

    readonly id: string;

}

export interface Entry extends Focus, Frame {

    readonly id: string;
    readonly label?: string | Dictionary;

}

export interface Error<D extends Frame=Frame> {

    readonly status: number;
    readonly reason: string;

    readonly detail?: D;

}


export function isFocus(value: any): value is Focus {
    return isObject(value) && isString(value.id);
}

export function isEntry(value: any): value is Entry {
    return isFocus(value) && isFrame(value);
}

export function isError(value: any): value is Error {
    return isNumber(value.status) && isString(value.reason) && (
        value.detail === undefined || isFrame(value.detail)
    );
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export interface Stats extends Frame {

    readonly id: string;
    readonly count: number;

    readonly min?: Value;
    readonly max?: Value;

    readonly stats: Immutable<Array<{

        readonly id: string;
        readonly count: number;

        readonly min?: Value
        readonly max?: Value

    }>>;

}

export interface Range {

    readonly min?: Literal,
    readonly max?: Literal

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export type Value=Literal | Dictionary | Frame

export type Literal=boolean | number | string

export interface Dictionary {

    readonly [lang: string]: string;

}

export interface Frame {

    readonly [field: string]: undefined | Value | Immutable<Value[]>;

}


export function isValue(value: any): value is Value {
    return isLiteral(value) || isFrame(value) || isDictionary(value); // as a last resort to avoid expensive checks
}

export function isLiteral(value: any): value is Literal {
    return isBoolean(value) || isNumber(value) || isString(value);
}

// https://www.rfc-editor.org/rfc/rfc5646.html#section-2.2.9
export function isDictionary(value: any): value is Dictionary {
    return isObject(value) && !("id" in value) && Object.entries(value).every(([key, value]) =>
        isString(key) && /[a-zA-Z]{2,3}(-[a-zA-Z0-9]{2,8})*/.test(key) && isString(value)
    );
}

export function isFrame(value: any): value is Frame {
    return isObject(value) && Object.entries(value).every(([key, value]) =>
        isString(key) && isArray(value) && value.every(isValue)
    );
}


//// !!! ///////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function required<T=any>(value: T): typeof value {
    return value;
}

export function optional<T=any>(value: T): undefined | typeof value {
    return value;
}

export function repeatable<T=any>(value: T): (typeof value)[] {
    return [value];
}

export function multiple<T=any>(value: T): (typeof value)[] {
    return [value];
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function string(value: undefined | Value, locales: readonly string[]=navigator.languages): string {
    return isBoolean(value) ? value.toString()
        : isNumber(value) ? value.toLocaleString(locales as string[])
            : isString(value) ? value
                : isEntry(value) ? label(value, locales)
                    : isDictionary(value) ? local(value, locales)
                        : "";
}

export function label(entry: Entry, locales: readonly string[]=navigator.languages): string {
    return string(entry.label, locales) || guess(entry.id) || "";
}

export function local(dictionary: Dictionary, locales: readonly string[]=navigator.languages): string {
    return locales.map(l => dictionary[l]).filter(s => s)[0] || dictionary.en || Object.values(dictionary)[0] || "";
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


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function createState<V extends Frame, E extends Frame>({ fetch, value, error }: {

    fetch?: () => void,
    value?: V,
    error?: Error<E>,

}): State<V, E> {

    return <R>(probe: Probe<V, E, R>) => {

        const other=fetch ?? value ?? error;

        if ( fetch !== undefined && probe.fetch !== undefined ) {

            return probe.fetch instanceof Function ? probe.fetch(fetch) : probe.fetch;

        } else if ( value !== undefined && probe.value !== undefined ) {

            return probe.value instanceof Function ? probe.value(value) : probe.value;

        } else if ( error !== undefined && probe.error !== undefined ) {

            return probe.error instanceof Function ? probe.error(error) : probe.error;

        } else if ( other !== undefined && probe.other !== undefined ) {

            return probe.other instanceof Function ? probe.other(other) : probe.other;

        } else {

            return undefined;

        }

    };

}

export function process<P, R>(processor: (response: Response, payload: string | P) => R): (response: Response) => Promise<R> {
    return response => {

        const mime=response.headers.get("Content-Type");

        if ( mime?.match(/^text\/plain\b/i) ) {

            return response.text()

                .catch(reason => {

                    console.error(`unreadable text payload <${reason}>`);

                    return "";

                })

                .then(text => processor(response, text));

        } else if ( mime?.match(/^application\/(ld\+)?json\b/i) ) {

            return response.json()

                .catch(reason => {

                    console.error(`unreadable JSON payload <${reason}>`);

                    return {};

                })

                .then(json => processor(response, immutable(json)));

        } else {

            return Promise

                .resolve(processor(response, <P>immutable({})));

        }

    };
}