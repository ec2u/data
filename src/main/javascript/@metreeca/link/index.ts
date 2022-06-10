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

import { Immutable, isNumber, isObject, isString } from "@metreeca/core";


export interface Graph {

    get<V extends Frame, E extends Frame, R>(id: string, model: V, query: Query, probe: Probe<typeof model, E, R>): undefined | R;

    post<V extends Frame, E extends Frame>(id: string, frame: V, probe: Probe<Frame, E>): void;

    put<V extends Frame, E extends Frame>(id: string, state: V, probe: Probe<Resource, E>): void;

    del<E extends Frame>(id: string, probe: Probe<Resource, E>): void;


    observe(id: string, observer: () => void): () => void;

}

export interface Entry<V extends Frame, E extends Frame> {

    <R>(probe: Probe<V, E, R>): undefined | R;

}

export interface Probe<V, E extends Frame, R=void> {

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

export interface Error<D extends Frame=Frame> {

    readonly status: number;
    readonly reason: string;

    readonly detail?: D;

}

export interface Resource extends Frame {

    readonly id: string;
    readonly label?: string | Dictionary;

}

export interface Frame {

    readonly [field: string]: undefined | Value | Immutable<Value[]>;

}

export interface Dictionary {

    readonly [lang: string]: string;

}

export type Literal=boolean | string | number
export type Value=Literal | Dictionary | Frame


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function isError(value: unknown): value is Error {
    return isObject(value) && isNumber(value.status) && isString(value.reason);
}


export function isSimples(value: any): value is Simples {
    return isSimple(value) || isArray(value) && value.every(isSimple);
}

export function isSimple(value: any): value is Simple {
    return value === undefined || isPlain(value) || isFocus(value);
}


export function isValues(value: any): value is Values {
    return isValue(value) || isArray(value) && value.every(isValue);
}

export function isValue(value: any): value is Value {
    return isPlain(value) || isFrame(value) || isLangs(value); // langs as a last resort to postpone expensive checks
}


export function isPlain(value: any): value is Plain {
    return typeof value === "boolean" || typeof value === "number" || typeof value === "string";
}

export function isFrame(value: any): value is Frame {
    return isFocus(value) && isState(value);
}

export function isFocus(value: any): value is Focus {
    return isObject(value) && "id" in value; // !!! isId(id), types, label
}

export function isState(value: any): value is Entry {
    return isObject(value) && Object.entries(value).every(([key, value]) => isString(key) && isValues(value));
}

export function isLangs(value: any): value is Langs {
    if ( isObject(value) && !("id" in value) ) {

        for (const p in value) {
            if ( typeof (<any>value)[p] !== "string" ) { return false; }
        }

        return true;

    } else {

        return false;

    }
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
