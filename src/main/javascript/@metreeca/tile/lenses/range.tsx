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

import { isDate, isDateTime, isNumber, isString } from "@metreeca/core";
import { trailing } from "@metreeca/core/callbacks";
import { DataTypes, Literal, Query } from "@metreeca/link";
import { toLocaleDateString } from "@metreeca/tile/inputs/date";
import { AlertIcon, Calendar, CheckSquare, Clock, Hash, Type, X } from "@metreeca/tile/widgets/icon";
import { NodeSpin } from "@metreeca/tile/widgets/spin";
import { classes } from "@metreeca/tool";
import { Setter } from "@metreeca/tool/hooks";
import { useCache } from "@metreeca/tool/hooks/cache";
import { useRange } from "@metreeca/tool/nests/graph";
import { useRoute } from "@metreeca/tool/nests/router";
import * as React from "react";
import { createElement, useCallback, useEffect, useRef, useState } from "react";
import "./range.css";


const AutoDelay=500;

const WideTypes=new Set(["date", "dateTime"]);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function NodeRange({

    id,
    path,
    type,

    as,
    compact=true,
    placeholder,

    state: [query, setQuery]

}: {

    id?: string,
    path: string,
    type: keyof typeof DataTypes,

    as?: keyof typeof DataTypes,
    compact?: boolean
    placeholder?: string

    state: [Query, Setter<Query>]

}) {

    const element=useRef<Element>(null);
    const [focused, setFocused]=useState(false);


    useEffect(() => {

        function focus(e: FocusEvent) {
            return setFocused(
                e.target instanceof Node && (element.current?.contains(e.target) || false) && (
                    focused || e.target instanceof HTMLInputElement && e.target.parentElement?.tagName === "HEADER"
                )
            );
        }

        window.addEventListener("focus", focus, true);

        return () => window.removeEventListener("focus", focus, true);

    });


    const [route]=useRoute();

    const [range, setRange]=useRange(id || route, path, type, [query, setQuery]);
    const cache=useCache(range({ value: range => range }));


    const doUpdate=useCallback(trailing(AutoDelay, setRange), [setRange]);

    function doReset() {
        setRange(null);
    }


    const selected=cache?.gte !== undefined || cache?.lte !== undefined;
    const expanded=!compact || focused || selected;

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

            <i><Icon as={as ?? type}/></i>

            <input readOnly placeholder={placeholder}/>

            <nav>{range({

                fetch: <NodeSpin/>,
                error: <AlertIcon/>, // !!! tooltip
                value: selected && <button title={"Reset"} onClick={doReset}><X/></button>

            })}</nav>

        </header>

        {expanded && <section className={classes({ wide: WideTypes.has(as ?? type) })}>

            <Input as={as ?? type} type={type} max={cache?.lte} placeholder={cache?.min}
                value={cache?.gte} onChange={gte => doUpdate({ gte })}
            />

            <Input as={as ?? type} type={type} min={cache?.gte} placeholder={cache?.max}
                value={cache?.lte} onChange={lte => doUpdate({ lte })}
            />

        </section>}

    </>);

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function Icon({

    as

}: {

    as: keyof typeof DataTypes

}) {

    switch ( as ) {

        case "boolean":

            return <CheckSquare/>;

        case "integer":

            return <Hash/>;

        case "decimal":

            return <Hash/>;

        case "string":

            return <Type/>;

        case "dateTime":

            return <Calendar/>;

        case "date":

            return <Calendar/>;

        case "time":

            return <Clock/>;

        case "gYear":

            return <Calendar/>;

        case "anyURI":

            throw "to be implemented";

    }

}

function Input({

    as,
    type,

    min,
    max,
    placeholder,

    value,
    onChange

}: {

    as: keyof typeof DataTypes
    type: keyof typeof DataTypes

    min?: Literal
    max?: Literal
    placeholder: undefined | Literal

    value: undefined | Literal
    onChange: (value: undefined | Literal) => void

}) {

    switch ( as ) {

        case "boolean":

            throw "to be implemented";

        case "integer":

            return <IntegerInput type={type} min={min} max={max} placeholder={placeholder} value={value} onChange={onChange}/>;

        case "decimal":

            throw "to be implemented";

        case "string":

            throw "to be implemented";

        case "dateTime":

            throw "to be implemented";

        case "date":

            return <DateInput type={type} min={min} max={max} placeholder={placeholder} value={value} onChange={onChange}/>;

        case "time":

            throw "to be implemented";

        case "gYear":

            return <GYearInput type={type} min={min} max={max} placeholder={placeholder} value={value} onChange={onChange}/>;

        case "anyURI":

            throw "to be implemented";

    }

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function IntegerInput({

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
    placeholder?: Literal

    value: undefined | Literal
    onChange: (value: undefined | Literal) => void

}) {

    function integer(literal: undefined | Literal): undefined | number {
        return literal === undefined ? undefined
            : isNumber(literal) ? Number.isFinite(literal) ? Math.trunc(literal) : undefined
                : isString(literal) ? integer(parseFloat(literal))
                    : undefined;
    }

    function literal(integer: undefined | number): undefined | Literal {
        return integer === undefined ? undefined
            : type === "integer" || type === "decimal" ? integer
                : type === "string" ? integer.toString()
                    : undefined;
    }


    function decode(string: undefined | string): undefined | number {
        return string ? parseInt(string) : undefined;
    }

    function encode(integer: undefined | number): undefined | string {
        return integer !== undefined ? integer.toLocaleString() : undefined;
    }


    return <input type={"number"} key={String(value)}

        min={integer(min)}
        max={integer(max)}

        placeholder={encode(integer(placeholder))}
        defaultValue={integer(value)}

        onChange={e => {

            if ( e.target.checkValidity() ) {
                onChange(literal(decode(e.target.value.trim())));
            }

        }}

    />;

}

function DateInput({

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


    function date(literal: undefined | Literal): undefined | string {
        return literal === undefined ? undefined
            : isDateTime(literal) ? literal.substring(0, 10)
                : isDate(literal) ? literal
                    : undefined;
    }

    function literal(date: undefined | string): undefined | Literal {
        return date === undefined ? undefined
            : type === "dateTime" ? `${date}T00:00:00Z`
                : type === "date" ? date
                    : type === "string" ? date
                        : undefined;
    }


    function decode(string: undefined | string): undefined | string {
        return string ? string : undefined;
    }

    function encode(date: undefined | string): undefined | string {
        return date ? toLocaleDateString(new Date(`${date}T00:00:00Z`)) : undefined;
    }


    const [focused, setFocused]=useState(false);


    return <input type={focused || value ? "date" : "text"} key={String(value)}

        min={date(min)}
        max={date(max)}

        placeholder={encode(date(placeholder))}
        defaultValue={date(value)}

        onFocus={() =>

            setFocused(true)

        }

        onBlur={e => {

            setFocused(false);

            // ;(chrome) no change event on clear

            const current=decode(e.target.value.trim());

            if ( e.target.checkValidity() && current !== value ) {
                onChange(current);
            }

        }}

        onChange={e => {

            if ( e.target.checkValidity() ) {
                onChange(literal(decode(e.target.value.trim())));
            }

        }}

    />;

}

function GYearInput({

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
    placeholder?: Literal

    value: undefined | Literal
    onChange: (value: undefined | Literal) => void

}) {

    function gYear(literal: undefined | Literal): undefined | number {
        return literal === undefined ? undefined
            : isNumber(literal) ? Number.isFinite(literal) ? Math.trunc(literal) : undefined
                : isDate(literal) ? new Date(`${literal}T00:00:00Z`).getFullYear()
                    : isDateTime(literal) ? new Date(literal).getFullYear()
                        : isString(literal) ? gYear(parseFloat(literal))
                            : undefined;
    }

    function literal(gYear: undefined | number): undefined | Literal {
        return gYear === undefined ? undefined
            : type === "integer" || type === "decimal" ? gYear
                : type === "date" ? `${gYear}-01-01`
                    : type === "dateTime" ? `${gYear}-01-01T00:00:00Z`
                        : type === "string" ? gYear?.toString()
                            : undefined;
    }


    function decode(string: undefined | string): undefined | number {
        return string ? parseInt(string) : undefined;
    }

    function encode(integer: undefined | number): undefined | string {
        return integer ? integer.toString() : undefined;
    }


    return <input type={"number"} key={String(value)}

        min={gYear(min)}
        max={gYear(max)}

        placeholder={encode(gYear(placeholder))}
        defaultValue={gYear(value)}

        onChange={e => {

            if ( e.target.checkValidity() ) {
                onChange(literal(decode(e.target.value.trim())));
            }

        }}

    />;

}
