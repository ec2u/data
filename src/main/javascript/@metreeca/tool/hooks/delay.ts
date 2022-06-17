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

import { isNumber } from "@metreeca/core";
import { Setter } from "@metreeca/tool/hooks/index";
import { useUpdate } from "@metreeca/tool/hooks/update";
import { RefObject, useEffect, useRef } from "react";


const DefaultDelay=500;


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 *
 * @param delay the delay in ms before changes are auto-submitted after the last edit; 0 to disable
 * @param value
 * @param setValue
 */
export function useDelay(
    delay: undefined | boolean | number,
    [value, setValue]: [string, Setter<string>]
): RefObject<HTMLInputElement> {

    const auto=isNumber(delay) ? delay : delay ? DefaultDelay : 0;

    const update=useUpdate();
    const input=useRef<HTMLInputElement>(null);


    useEffect(() => {

        let timeout: number;

        function onInput(e: Event) {
            if ( auto > 0 ) {

                clearTimeout(timeout);

                timeout=setTimeout(() => setValue((e.target as HTMLInputElement).value), auto);

                update();

            }
        }

        function onChange(e: Event) {

            if ( auto > 0 ) { clearTimeout(timeout); }

            setValue((e.target as HTMLInputElement).value);

        }

        input.current?.addEventListener("input", onInput);
        input.current?.addEventListener("change", onChange);

        return () => {
            input.current?.removeEventListener("input", onInput);
            input.current?.removeEventListener("change", onChange);
        };

    }, [auto, input.current]);

    useEffect(() => {

        if ( input.current ) {

            input.current.value=value;

            update();

        }

    }, [value]);

    return input;
}