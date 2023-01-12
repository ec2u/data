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

import { equals, Immutable, Primitive } from "@metreeca/core";
import { useStorage } from "@metreeca/tool/hooks/storage";
import { useRoute } from "@metreeca/tool/nests/router";
import { useEffect, useState } from "react";


/**
 * Search parameters string.
 */
export interface Parameters {

    readonly [key: string]: undefined | Primitive | Immutable<Primitive[]>;

}


export function useParameters<T extends Parameters=Parameters>(initial: T): [T, (parameters: T) => void];
export function useParameters<T extends Parameters=Parameters>(initial: T, storage: Storage): [T, (parameters: T) => void];

export function useParameters<T extends Parameters=Parameters>(initial: T, storage?: Storage): [T, (parameters: T) => void] {

    const [route]=useRoute();

    const [state, setState]=(storage === undefined)
        ? useState(initial)
        : useStorage(storage, route, initial);

    const value={ ...state, ...parameters() };

    useEffect(() => {

        setState(value);
        parameters(value, initial);

    }, [JSON.stringify([initial, value])]);

    return [state, state => {

        setState(state);
        parameters(state, initial);

    }];
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function parameters<T>(query?: Parameters, defaults?: Parameters): Parameters {
    if ( query === undefined ) { // getter

        const query={};

        new URLSearchParams(location.search.substring(1)).forEach((value, key) => {

            const current=(query as any)[key];

            (query as any)[key]=current === undefined ? value
                : Array.isArray(current) ? [...current, value]
                    : [current, value];

        });

        return query;

    } else { // setter

        const params=new URLSearchParams();

        Object.entries(query)

            .filter(([key, values]) => !defaults || !equals(values, defaults[key]))

            .forEach(([key, values]) => (Array.isArray(values) ? values : [values]).forEach(value =>
                params.append(key, String(value))
            ));

        const search=params.toString();

        history.replaceState(history.state, document.title,
            search ? `${location.pathname}?${search}${location.hash}` : `${location.pathname}${location.hash}`
        );

        return {};

    }
}
