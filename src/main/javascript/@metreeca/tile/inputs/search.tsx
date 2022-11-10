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

import { ClearIcon, Search } from "@metreeca/tile/widgets/icon";
import { classes } from "@metreeca/tool";
import { Setter } from "@metreeca/tool/hooks";
import { useDelay } from "@metreeca/tool/hooks/delay";
import * as React from "react";
import { createElement, ReactNode } from "react";
import "./search.css";


export function NodeSearch({

    disabled,

    icon,
    menu,

    placeholder,

    auto,

    state: [value, setValue]

}: {

    disabled?: boolean

    icon?: boolean | ReactNode
    menu?: ReactNode

    placeholder?: string

    /**
     * The delay in ms before changes are auto-submitted after the last edit; 0 to disable.
     */
    auto?: boolean | number

    state: [string, Setter<string>]

}) {

    const input=useDelay(auto, [value, setValue]);


    function doClear() {
        setValue("");
    }


    return createElement("node-search", {

        disabled: disabled ? "disabled" : undefined,

        class: classes({ "node-input": true })

    }, <>

        {icon && <nav>{icon === true ? <Search/> : icon}</nav>}

        <input ref={input}

            type="text" disabled={disabled}

            placeholder={placeholder}

            onFocus={e => e.currentTarget.select()}

        />

        <nav>{input.current?.value
            ? <button type={"button"} title="Clear" onClick={doClear}><ClearIcon/></button>
            : menu
        }</nav>

    </>);
}