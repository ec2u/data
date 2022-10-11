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

import { isArray } from "@metreeca/core";
import * as React from "react";
import { createElement, ReactNode } from "react";
import "./label.css";


export function NodeLabel({

    name,
    menu,

    rule=false,

    large=false,
    small=false,
    right=false,

    children

}: {

    name: ReactNode
    menu?: ReactNode

    rule?: boolean,

    large?: boolean
    small?: boolean
    right?: boolean

    children?: ReactNode

}) {
    return createElement("node-label", {

        rule: rule ? "" : undefined,

        large: large ? "" : undefined,
        small: small ? "" : undefined,
        right: right ? "" : undefined

    }, <>

        <label>
            <span>{name}</span>
            <nav>{menu}</nav>
        </label>

        {isArray(children)
            ? <ul>{children.map((child, index) => <li key={index}>{child}</li>)}</ul>
            : children}

    </>);

}