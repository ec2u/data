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

import { isDateTime } from "@metreeca/core";
import { trailing } from "@metreeca/core/callbacks";
import { DataTypes, Literal, Query } from "@metreeca/link";
import { toLocaleDateString } from "@metreeca/tile/inputs/date";
import { Calendar, CheckSquare, Clock, Hash, Type } from "@metreeca/tile/widgets/icon";
import { classes } from "@metreeca/tool";
import { Setter } from "@metreeca/tool/hooks";
import { useRange } from "@metreeca/tool/hooks/content";
import * as React from "react";
import { createElement, useCallback, useEffect, useRef, useState } from "react";
import "./stats.css";


const AutoDelay=500;

const WideTypes=new Set(["date", "dateTime", "dateTimeStart"]);


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

    const element=useRef<Element>(null);
    const [focused, setFocused]=useState(false);


    useEffect(() => {

        function focus(e: FocusEvent) {
            setFocused(e.target instanceof Node && element.current?.contains(e.target) || false);
        }

        window.addEventListener("focus", focus, true);

        return () => {
            window.removeEventListener("focus", focus, true);
        };

    });


    const [range, setRange]=useRange(id, path, type, [query, setQuery]);


    const doUpdate=useCallback(trailing(AutoDelay, setRange), [setRange]);



    return createElement("node-stats", {

        ref: element,

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
            <i><Icon type={type}/></i>
            <input readOnly placeholder={placeholder}/>
        </header>

        {range({

            value: range => {

                const expanded=!compact || focused || range?.gte !== undefined || range?.lte !== undefined;

                return expanded && <section className={classes({ wide: WideTypes.has(type) })}>

                    <Input type={type} max={range?.lte} placeholder={range?.min}
                        value={range?.gte} onChange={gte => doUpdate({ gte })}
                    />

                    <Input type={type} min={range?.gte} placeholder={range?.max}
                        value={range?.lte} onChange={lte => doUpdate({ lte })}
                    />

                </section>;
            }

        })}

    </>);

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function Icon({

    type

}: {

    type: keyof typeof DataTypes

}) {

    switch ( type ) {

        case "boolean":

            return <CheckSquare/>;

        case "integer":

            return <Hash/>;

        case "decimal":

            return <Hash/>;

        case "string":

            return <Type/>;

        case "date":

            return <Calendar/>;

        case "time":

            return <Clock/>;

        case "dateTime":

            return <Calendar/>;

        case "dateTimeStart":

            return <Calendar/>;

    }

}

function Input({

    type,

    min,
    max,
    placeholder,

    value,
    onChange

}: {

    type: keyof typeof DataTypes

    min?: Literal
    max?: Literal
    placeholder: undefined | Literal

    value: undefined | Literal
    onChange: (value: undefined | Literal) => void

}) {

    switch ( type ) {

        case "boolean":

            throw "to be implemented";

        case "integer":

            throw "to be implemented";

        case "decimal":

            throw "to be implemented";

        case "string":

            throw "to be implemented";

        case "date":

            throw "to be implemented";

        case "time":

            throw "to be implemented";

        case "dateTime":

            throw "to be implemented";

        case "dateTimeStart":

            return <DateTimeStartInput min={min} max={max} placeholder={placeholder} value={value} onChange={onChange}/>;

    }

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function DateTimeStartInput({

    min,
    max,
    placeholder,

    value,
    onChange

}: {

    min?: Literal,
    max?: Literal,
    placeholder: undefined | Literal,

    value: undefined | Literal,
    onChange: (value: undefined | Literal) => void

}) {

    const [focused, setFocused]=useState(false);


    function decode(value: undefined | Literal): undefined | string {
        return isDateTime(value) ? new Date(value).toISOString().substring(0, 10) : undefined;
    }

    function encode(value: undefined | string): undefined | Literal {
        return value ? `${value}T00:00:00Z` : undefined;
    }


    const _placeholder=decode(placeholder);

    return <input type={focused || value ? "date" : "text"}

        min={decode(min)}
        max={decode(max)}

        placeholder={_placeholder && toLocaleDateString(new Date(_placeholder))}
        defaultValue={decode(value)}

        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}

        onChange={e => {

            if ( e.target.checkValidity() ) {
                onChange(encode(e.target.value.trim()));
            }

        }}

    />;

}