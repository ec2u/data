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

import { isLiteral, Literal, Query, string, Value } from "@metreeca/link";
import { Calendar } from "@metreeca/tile/widgets/icon";
import { classes } from "@metreeca/tool";
import { Setter } from "@metreeca/tool/hooks";
import { Stats, useStats } from "@metreeca/tool/nests/graph";
import * as React from "react";
import { createElement, useCallback, useEffect, useRef, useState } from "react";
import "./stats.css";


const AutoDelay=500;


export function trailing<H extends (...args: any[]) => void>(delay: number, handler: H): typeof handler {
    if ( delay <= 0 ) {

        return handler;

    } else {

        let timeout: number;

        function wrapper(this: unknown, ...args: unknown[]) {

            clearTimeout(timeout);

            timeout=setTimeout(() => handler.apply(this, args), delay);

        }

        return wrapper as typeof handler;

    }
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function NodeStats({

    id,
    path,
    type,

    compact,
    placeholder,
    pattern=/\d+(\.\d+)?/, // !!! adapt to facet type
    format,

    state: [query, setQuery]

}: {

    id: string,
    path: string,
    type?: "number" | "date" | "date()" | "time" | "datetime"

    compact?: boolean
    placeholder?: string
    pattern?: string | RegExp
    format?: (value: Value) => string

    state: [Query, Setter<Query>]

}) {

    function toLiteral(value: unknown): undefined | Literal {
        return isLiteral(value) ? value : undefined;
    }


    const range={
        min: toLiteral(query[`>=${path}`]),
        max: toLiteral(query[`<=${path}`])
    };


    const root=useRef<Element>(null);
    const [focused, setFocused]=useState(false);

    const expanded=!compact || focused;


    useEffect(() => {

        const focus=(e: FocusEvent) => doActivate(
            e.target instanceof Node && root.current?.contains(e.target) || false
        );

        window.addEventListener("focus", focus, true);

        return () => {
            window.removeEventListener("focus", focus, true);
        };

    });


    const [min, setMin]=useState(range.min);
    const [max, setMax]=useState(range.max);

    const [stats, setStats]=useStats(id, path, [query, setQuery]);
    const [cache, setCache]=useState<Stats>();

    useEffect(
        () => { stats({ value: frame => setCache(frame) }); },
        [JSON.stringify(stats({ value: frame => frame }) || cache)]
    );


    const doSetRange=useCallback(trailing(AutoDelay, (min: undefined | Literal, max: undefined | Literal) => {

        setStats({ min, max });

    }), [setStats]);


    const control={

        "": "search",

        "number": "number",
        "date": "date",
        "date()": "date",
        "time": "time",
        "datetime": "datetime-local"

    }[type || ""];


    function effective(value: undefined | Literal) {
        return (type === "date" || type === "time" || type === "datetime") && !value ? "text" : control;
    }

    function toString(value: undefined | Value, placeholder=false) {
        return value === undefined ? ""
            : format !== undefined ? format(value)

                // : placeholder && isNumber(value) ? toLocaleNumberString(value)
                //     : placeholder && isInteger && isString(value) ? toLocaleNumberString(parseInt(value))
                //         : placeholder && isDecimal && isString(value) ? toLocaleNumberString(parseFloat(value))
                //
                //             : placeholder && isDate && isString(value) ? toLocaleDateString(new Date(value))
                //                 : placeholder && isTime && isString(value) ? toLocaleTimeString(new Date(`1970-01-01T${value}`))
                //                     : placeholder && isDateTime && isString(value) ? toLocaleDateTimeString(new Date(value))

                : string(value);
    }


    function doActivate(activate: boolean) {
        setFocused(activate);
    }


    function lower() {
        return <input type={effective(min)} className={"node-input"}

            pattern={pattern.toString()}
            placeholder={toString(cache?.min, true)}
            defaultValue={toString(range.min)}

            onFocus={e => e.currentTarget.type=control}
            onBlur={e => e.currentTarget.type=effective(range.min)}

            onInput={e => {

                const minInput=e.currentTarget;
                const maxInput=minInput.nextElementSibling as HTMLInputElement;

                const minValue=minInput.value || undefined;
                const maxValue=max;

                if ( minValue !== undefined && maxValue !== undefined && minValue > maxValue ) {
                    minInput.setCustomValidity("minimum value greater than maximum");
                    maxInput.setCustomValidity("maximum value lower than minimum");
                } else {
                    minInput.setCustomValidity("");
                    maxInput.setCustomValidity("");
                }

                minInput.reportValidity();

                setMin(minValue);
                doSetRange(minInput.checkValidity() ? minValue : undefined, maxValue);

            }}

        />;
    }

    function upper() {
        return <input type={effective(max)} className={"node-input"}

            pattern={pattern.toString()}
            placeholder={toString(cache?.max, true)}
            defaultValue={toString(range.max)}

            onFocus={e => e.currentTarget.type=control}
            onBlur={e => e.currentTarget.type=effective(range.max)}

            onInput={e => {

                const maxInput=e.currentTarget;
                const minInput=maxInput.previousElementSibling as HTMLInputElement;

                const minValue=min;
                const maxValue=maxInput.value || undefined;

                if ( minValue !== undefined && maxValue !== undefined && maxValue < minValue ) {
                    minInput.setCustomValidity("minimum value greater than maximum");
                    maxInput.setCustomValidity("maximum value lower than minimum");
                } else {
                    minInput.setCustomValidity("");
                    maxInput.setCustomValidity("");
                }

                maxInput.reportValidity();

                setMax(maxValue);
                doSetRange(minValue, maxInput.checkValidity() ? maxValue : undefined);

            }}

        />;
    }

    return createElement("node-stats", {

        ref: root,

        class: classes({ "node-input": true, focused }),

        onKeyDown: e => {
            if ( e.key === "Escape" || e.key === "Enter" ) {

                e.preventDefault();

                if ( document.activeElement instanceof HTMLElement ) {
                    document.activeElement.blur();
                }

                doActivate(false);

            }
        }

    }, <>


        <header>

            <i><Calendar/></i> {/* !!! configure on type */}

            <input readOnly placeholder={placeholder}/>

        </header>

        {expanded && <section>
            {lower()}
            {upper()}
        </section>}

    </>);

}
