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
import { ClearIcon, Search } from "@metreeca/tile/widgets/icon";
import { classes } from "@metreeca/tool";
import { Setter } from "@metreeca/tool/hooks";
import { useTrailing } from "@metreeca/tool/hooks/trailing";
import * as React from "react";
import { createElement, ReactNode, useEffect, useRef, useState } from "react";
import "./search.css";


const AutoDelay=500;


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function NodeSearch({

    disabled,

    icon=false,
    rule=false,

    menu,

    placeholder,

    auto,

    state: [value, setValue]

}: {

    disabled?: boolean

    icon?: boolean | ReactNode
    rule?: boolean

    menu?: ReactNode

    placeholder?: string

    /**
     * The delay in ms before changes are auto-submitted after the last edit; 0 to disable.
     */
    auto?: boolean | number

    state: [string, Setter<string>]

}) {

    const input=useRef<HTMLInputElement>(null);

    const [state, setState]=useState(value);


    useEffect(() => setState(value), [value]);


    const doSearch=useTrailing(isNumber(auto) ? auto : auto ? AutoDelay : 0, (value: string) => {

        if ( auto ) { setValue(value); }

    }, [state]);


    function doClear() {

        setValue("");

        input.current?.focus();

    }


    return createElement("node-search", {

        disabled: disabled ? "disabled" : undefined,

        class: classes({ "node-input": true, rule })

    }, <>

        {icon && <nav>{icon === true ? <Search/> : icon}</nav>}

        <input ref={input}

            type="text" disabled={disabled}

            placeholder={placeholder}
            value={state}

            onFocus={e => e.currentTarget.select()}

            onInput={e => {
                setState(e.currentTarget?.value || "");
                doSearch(e.currentTarget?.value || "");
            }}

        />

        {state && <nav>
            <button type={"button"} title="Clear" onClick={doClear}><ClearIcon/></button>
        </nav> || menu && <nav>{menu}</nav>}

    </>);
}