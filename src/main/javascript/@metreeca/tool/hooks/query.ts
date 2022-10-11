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

import { equals, isEmpty } from "@metreeca/core";
import { Query } from "@metreeca/link";
import { useStorage } from "@metreeca/tool/hooks/storage";
import { useRoute } from "@metreeca/tool/nests/router";
import { useEffect, useState } from "react";


export function useQuery(initial: Query): [Query, (query: Query) => void];
export function useQuery(initial: Query, storage: Storage): [Query, (query: null | Query) => void];

export function useQuery(initial: Query, storage?: Storage): [Query, (query: null | Query) => void] {

    const [route]=useRoute();

    const [state, setState]=(storage === undefined)
        ? useState(initial)
        : useStorage(storage, route, initial);

    const value={ ...state, ...query() };

    useEffect(() => {

        setState(value);
        query(value, initial);

    }, [JSON.stringify([initial, value])]);

    return [state, state => {

        setState(state || initial);
        query(state || initial, initial);

    }];
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function query<T>(query?: Query, defaults?: Query): Query {
    if ( query === undefined ) { // getter

        return JSON.parse(decodeURI(location.search.substring(1) || "{}"));

    } else { // setter

        const clean=Object.entries(query)
            .filter(([key, value]) => key.startsWith(".") ? Boolean(value) : value !== undefined)
            .filter(([key, values]) => !defaults || !equals(values, defaults[key]))
            .reduce((query, [key, value]) => Object.assign(query, { [key]: value }), {});

        history.replaceState(history.state, document.title, isEmpty(clean)
            ? `${location.pathname}${location.hash}`
            : `${location.pathname}?${(encodeURI(JSON.stringify(clean)))}${location.hash}`
        );

        return {};

    }
}
