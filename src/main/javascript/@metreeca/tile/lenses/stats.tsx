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

import { immutable, isString } from "@metreeca/core";
import { DataTypes, Literal, Query } from "@metreeca/link";
import { toLocaleDateString } from "@metreeca/tile/inputs/date";
import { Calendar, CheckSquare, Clock, Hash, Type } from "@metreeca/tile/widgets/icon";
import { classes } from "@metreeca/tool";
import { Setter } from "@metreeca/tool/hooks";
import { useRange } from "@metreeca/tool/nests/graph";
import * as React from "react";
import { createElement, ReactNode, useCallback, useEffect, useRef, useState } from "react";
import "./stats.css";


const AutoDelay=500;

const Icons: Record<keyof typeof DataTypes, ReactNode>=immutable({

    boolean: <CheckSquare/>,
    integer: <Hash/>,
    decimal: <Hash/>,
    string: <Type/>,

    date: <Calendar/>,
    time: <Clock/>,
    dateTime: <Calendar/>,
    dateTimeStart: <Calendar/>

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function NodeStats({

    id,
    path,
    type,

    compact,
    placeholder,

    state: [query, setQuery]

}: {

    id: string,
    path: string,
    type: keyof typeof DataTypes

    compact?: boolean
    placeholder?: string

    state: [Query, Setter<Query>]

}) {

    const root=useRef<Element>(null);
    const [focused, setFocused]=useState(false);


    useEffect(() => {

        function focus(e: FocusEvent) {
            setFocused(e.target instanceof Node && root.current?.contains(e.target) || false);
        }

        window.addEventListener("focus", focus, true);

        return () => {
            window.removeEventListener("focus", focus, true);
        };

    });


    const [range, setRange]=useRange(id, path, type, [query, setQuery]);

    const doSetRange=useCallback(trailing(AutoDelay, setRange), [setRange]);


    function consistent(gte: undefined | string, lte: undefined | string) {
        return gte === undefined || lte === undefined || new Date(gte).getTime() < new Date(lte).getTime();
    }


    // function GTEInput() {
    //     return <input type={_control}
    //
    //         pattern={pattern.toString()}
    //         placeholder={decode(range?.min)}
    //         value={decode(range?.gte)}
    //
    //         onFocus={e => e.currentTarget.type=_control}
    //         onBlur={e => e.currentTarget.type=_default}
    //
    //         onChange={e => {
    //
    //             const gteInput=e.currentTarget;
    //             const lteInput=gteInput.nextElementSibling as HTMLInputElement;
    //
    //             if ( consistent(gteInput.value, lteInput.value) ) {
    //                 gteInput.setCustomValidity("");
    //                 lteInput.setCustomValidity("");
    //             } else {
    //                 gteInput.setCustomValidity("minimum value greater than maximum");
    //                 lteInput.setCustomValidity("maximum value lower than minimum");
    //             }
    //
    //             gteInput.reportValidity();
    //
    //             if ( gteInput.checkValidity() ) {
    //                 doSetRange({ gte: encode(gteInput.value), lte: encode(lteInput.value) });
    //             }
    //
    //         }}
    //
    //     />;
    // }


    const expanded=!compact || focused || range?.gte !== undefined || range?.lte !== undefined;


    return createElement("node-stats", {

        ref: root,

        class: classes({ "node-input": true, focused }),

        onKeyDown: e => {
            if ( e.key === "Escape" || e.key === "Enter" ) {

                e.preventDefault();

                if ( document.activeElement instanceof HTMLElement ) {
                    document.activeElement.blur();
                }

                setFocused(false);

            }
        }

    }, <>

        <header>
            <i>{Icons[type]}</i>
            <input readOnly placeholder={placeholder}/>
        </header>

        {expanded && <section className={classes({ wide: type === "dateTime" })}>

            <DateTimeStartInput value={range?.gte} placeholder={range?.min}
                onChange={gte => doSetRange({ gte, lte: range?.lte })}
            />

            <DateTimeStartInput value={range?.lte} placeholder={range?.max}
                onChange={lte => doSetRange({ gte: range?.gte, lte })}
            />

        </section>}

    </>);

}


//// !!! ///////////////////////////////////////////////////////////////////////////////////////////////////////////////

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

function DateTimeStartInput({

    value,
    placeholder,

    onChange

}: {

    value?: Literal,
    placeholder?: Literal,

    onChange: (value: undefined | Literal) => void

}) {

    const [focused, setFocused]=useState(false);


    function decode(value: undefined | Literal): undefined | Date {
        return isString(value) ? new Date(value) : undefined;
    }

    function encode(value: undefined | string): undefined | Literal {
        return value && `${value}T00:00:00Z`;
    }


    const _value=decode(value);
    const _placeholder=decode(placeholder);

    return <input type={focused || value ? "date" : "text"}

        defaultValue={_value?.toISOString()?.substring(0, 10)}
        placeholder={_placeholder && toLocaleDateString(_placeholder)}

        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}

        onChange={e => onChange(encode(e.target.value.trim()))}

    />;

}