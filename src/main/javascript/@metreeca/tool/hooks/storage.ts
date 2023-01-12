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

import { Initial, Updater } from "@metreeca/tool/hooks/index";
import { useCallback, useEffect, useState } from "react";
import { isFunction } from "../../core";


export function useStorage<T=any>(storage: Storage, key: string, initial: Initial<T>): [T, Updater<T>] {

    const [value, setValue]=useState<T>(() => {

        const item=storage.getItem(key);

        return item !== null ? JSON.parse(item)
            : isFunction(initial) ? initial()
                : initial;

    });


    const sync=useCallback(() => {

        setValue(JSON.parse(localStorage.getItem(key) || "null"));

    }, [key]);


    useEffect(() => {

        if ( storage === localStorage ) {

            window.addEventListener("storage", sync);

            return () => window.removeEventListener("storage", sync);

        } else {

            return () => {};

        }

    }, []);


    return [value, value => {

        try { setValue(value); } finally {

            value === undefined
                ? storage.removeItem(key)
                : storage.setItem(key, JSON.stringify(value));

        }

    }];

}