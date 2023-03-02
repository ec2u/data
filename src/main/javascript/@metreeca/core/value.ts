/*
 * Copyright © 2020-2023 Metreeca srl
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

import { immutable, Immutable, isArray, isBoolean, isDate, isDateTime, isNumber, isObject, isString, isTime } from "@metreeca/core/index";
import { Frame } from "lucide-react";


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


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const DataTypes=immutable({

    boolean: "http://www.w3.org/2001/XMLSchema#boolen",
    integer: "http://www.w3.org/2001/XMLSchema#integer",
    decimal: "http://www.w3.org/2001/XMLSchema#decimal",
    string: "http://www.w3.org/2001/XMLSchema#string",

    dateTime: "http://www.w3.org/2001/XMLSchema#dateTime",
    date: "http://www.w3.org/2001/XMLSchema#date",
    time: "http://www.w3.org/2001/XMLSchema#time",

    gYear: "http://www.w3.org/2001/XMLSchema#gYear",

    anyURI: "http://www.w3.org/2001/XMLSchema#anyURI"

});


export type Value=Literal | Dictionary | Frame | Focus | Entry

export type Literal=boolean | number | string


export interface Dictionary {

    readonly [lang: string]: string;

}

export interface Focus {

    readonly id: string;

}

export interface Frame {

    readonly [field: string]: undefined | Value | Immutable<Value[]>;

}

export interface Entry extends Focus, Frame {

    readonly id: string;
    readonly label?: string | Dictionary;

}

export interface Collection<R extends Entry> extends Entry {

    readonly contains?: Immutable<R[]>;

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

export function isFocus(value: any): value is Focus {
    return isObject(value) && isString(value.id);
}

export function isFrame(value: any): value is Frame {
    return isObject(value) && Object.entries(value).every(([key, value]) =>
        isString(key) && (isValue(value) || isArray(value) && value.every(isValue))
    );
}

export function isEntry(value: any): value is Entry {
    return isFocus(value) && isFrame(value);
}

export function isCollection(value: any): value is Entry {
    return isEntry(value) && (
        value.contains === undefined || isArray(value.contains) && value.contains.every(isEntry)
    );
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


