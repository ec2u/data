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

import { immutable, Immutable, isArray, isBoolean, isDate, isDateTime, isNumber, isObject, isString, isTime } from "@metreeca/core";
import { Frame } from "lucide-react";


export interface Graph {

    get<V extends Entry, E>(id: string, model: V, query?: Query): State<V, E>;

    post<V extends Frame, E>(id: string, frame: V, probe: Probe<Focus, E>): void;

    put<V extends Entry, E>(id: string, frame: V, probe: Probe<Focus, E>): void;

    del<E>(id: string, probe: Probe<Focus, E>): void;


    observe(id: string, observer: () => void): () => void;

}

export interface State<V, E=unknown> {

    <R>(probe: Probe<V, E, R>): R;

    <R>(probe: Partial<Probe<V, E, R>> & Fallback<V, E, R>): R;

    <R>(probe: Partial<Probe<V, E, R>> & Partial<Fallback<V, E, R>>): undefined | R;

}

export interface Probe<V, E, R=void> {

    fetch: R | ((abort: () => void) => R);

    value: R | ((frame: V) => R);

    error: R | ((error: Error<E>) => R);

}

export interface Fallback<V, E, R=void> {

    other: R | ((state: (() => void) | V | Error<E>) => R);

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export interface Query {

    readonly ".links"?: string;
    readonly ".terms"?: string;
    readonly ".stats"?: string;

    readonly ".order"?: string | Immutable<string[]>;
    readonly ".offset"?: number;
    readonly ".limit"?: number;

    readonly [path: string]: undefined | Literal | Immutable<Array<Literal>>;

}

export interface Error<D> {

    readonly status: number;
    readonly reason: string;

    readonly detail?: D;

}


export interface Terms {

    readonly terms?: Immutable<Array<{

        readonly value: Value;
        readonly count: number;

    }>>;

}

export interface Stats {

    readonly count: number;

    readonly min?: Value;
    readonly max?: Value;

    readonly stats?: Immutable<Array<{

        readonly id: string;
        readonly count: number;

        readonly min: Value
        readonly max: Value

    }>>;

}


export function isError(value: any): value is Error<unknown> {
    return isNumber(value.status) && isString(value.reason);
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const DataTypes=immutable({

    boolean: "http://www.w3.org/2001/XMLSchema#boolen",
    integer: "http://www.w3.org/2001/XMLSchema#integer",
    decimal: "http://www.w3.org/2001/XMLSchema#decimal",
    string: "http://www.w3.org/2001/XMLSchema#string",

    date: "http://www.w3.org/2001/XMLSchema#date",
    time: "http://www.w3.org/2001/XMLSchema#time",
    dateTime: "http://www.w3.org/2001/XMLSchema#dateTime",
    dateTimeStart: "http://www.w3.org/2001/XMLSchema#dateTime",

    reference: "http://www.w3.org/2001/XMLSchema#anyURI"

});


export type Value=Literal | Dictionary | Frame | Focus | Entry

export type Literal=boolean | number | string


export interface Dictionary {

    readonly [lang: string]: string;

}

export interface Frame {

    readonly [field: string]: undefined | Value | Immutable<Value[]>;

}


export interface Focus {

    readonly id: string;

}

export interface Entry extends Focus, Frame {

    readonly id: string;
    readonly label?: string | Dictionary;

}


export function isValue(value: any): value is Value {
    return isLiteral(value)
        || isFrame(value)
        || isFocus(value)
        || isEntry(value)
        || isDictionary(value); // as a last resort to avoid expensive checks
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
        isString(key) && (isValue(value) || isArray(value) && value.every(isValue))
    );
}

export function isFocus(value: any): value is Focus {
    return isObject(value) && isString(value.id);
}

export function isEntry(value: any): value is Entry {
    return isFocus(value) && isFrame(value);
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function required<T=any>(value: T): typeof value {
    return value;
}

export function optional<T=any>(value: T): undefined | typeof value {
    return value;
}

export function repeatable<T=any>(value: T): typeof value[] {
    return [value];
}

export function multiple<T=any>(value: T): undefined | typeof value[] {
    return [value];
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function string(value: undefined | Value | Entry, locales: readonly string[]=navigator.languages): string {
    return isBoolean(value) ? value.toString()
        : isNumber(value) ? value.toLocaleString(locales as string[])
            : isDateTime(value) ? new Date(value).toLocaleString(locales as string[])
                : isDate(value) ? new Date(`${value}T00:00:00`).toLocaleDateString(locales as string[])
                    : isTime(value) ? new Date(`1970-01-01T${value}`).toLocaleTimeString(locales as string[])
                        : isString(value) ? value
                            : isEntry(value) ? label(value, locales)
                                : isDictionary(value) ? local(value, locales)
                                    : "";
}


function label(entry: Entry, locales: readonly string[]) {
    return string(entry.label, locales) || guess(entry.id) || "";
}

function local(dictionary: Dictionary, locales: readonly string[]=navigator.languages): string {
    return locales.map(l => dictionary[l]).filter(s => s)[0] || dictionary.en || Object.values(dictionary)[0] || "";
}

/**
 * Guesses a resource label from its id.
 *
 * @param id the resource id
 *
 * @returns a label guessed from `id` or an empty string, if unable to guess
 */
function guess(id: string): string {
    return id
        .replace(/^.*?(?:[/#:]([^/#:]+))?(?:\/|#|#_|#id|#this)?$/, "$1") // extract label
        .replace(/([a-z-0-9])([A-Z])/g, "$1 $2") // split camel-case words
        .replace(/[-_]+/g, " ") // split kebab-case words
        .replace(/\b[a-z]/g, $0 => $0.toUpperCase()); // capitalize words
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Merges an id and an optional query into an URL.
 *
 * @param id
 * @param query
 *
 * @return
 */
export function url(id: string, query?: Query) {
    if ( query ) {

        const params=new URLSearchParams();

        Object.entries(query)

            .flatMap(([key, value]) => <[string, undefined | Literal][]>(
                isArray<Literal>(value) ? value.map(value => [key, value as undefined | Literal])
                    : isLiteral(value) ? [[key, value as undefined | Literal]]
                        : [[key, undefined as undefined | Literal]]
            ))

            .filter(([key, value]) =>
                key.startsWith(".") ? Boolean(value) : value !== undefined
            )

            .forEach(([key, value]) =>
                params.append(key, String(value))
            );

        const search=params.toString();

        return search ? `${id}?${search}` : id;

    } else {

        return id;

    }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates a `fetch` {@link State} object.
 *
 * @param fetch the callback for aborting the fetch operation
 *
 * @constructor
 */
export function State<V, E=unknown>({ fetch }: {

    fetch: () => void

}): State<V, E>;

/**
 * Creates a `value` {@link State} object.
 *
 * @param value the value returned by the operation
 *
 * @constructor
 */
export function State<V, E=unknown>({ value }: {

    value: V

}): State<V, E>;

/**
 * Creates an `error` {@link State} object.
 *
 * @param error the error reported by the operation
 *
 * @constructor
 */
export function State<V, E=unknown>({ error }: {

    error: Error<E>,

}): State<V, E>;

export function State<V, E=unknown>({ fetch, value, error }: {

    fetch?: () => void,
    value?: V,
    error?: Error<E>,

}): State<V, E> {

    return function <R>(probe: any) {

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


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

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