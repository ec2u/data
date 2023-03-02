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

import { Error } from "@metreeca/core/value";


export interface State<V, D=unknown> {

    <R>(probe: Probe<V, D, R>): R;

    <R>(probe: Partial<Probe<V, D, R>> & Fallback<V, D, R>): R;

    <R>(probe: Partial<Probe<V, D, R>> & Partial<Fallback<V, D, R>>): undefined | R;

}

export interface Probe<V, D, R=void> {

    fetch: R | ((abort: () => void) => R);

    value: R | ((frame: V) => R);

    error: R | ((error: Error<D>) => R);

}

export interface Fallback<V, D, R=void> {

    other: R | ((state: (() => void) | V | Error<D>) => R);

}

/**
 * Creates a `fetch` {@link State} object.
 *
 * @param fetch the callback for aborting the fetch operation
 *
 * @constructor
 */
export function State<V, D=unknown>({ fetch }: {

    fetch: () => void

}): State<V, D>;
/**
 * Creates a `value` {@link State} object.
 *
 * @param value the value returned by the operation
 *
 * @constructor
 */
export function State<V, D=unknown>({ value }: {

    value: V

}): State<V, D>;
/**
 * Creates an `error` {@link State} object.
 *
 * @param error the error reported by the operation
 *
 * @constructor
 */
export function State<V, D=unknown>({ error }: {

    error: Error<D>,

}): State<V, D>;
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