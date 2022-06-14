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

import { ChevronDown, ChevronRight } from "@metreeca/skin/lucide";
import { Setter } from "@metreeca/tool/hooks";
import * as React from "react";
import { createElement, ReactNode, useEffect, useState } from "react";
import "./item.css";


export function ToolExpandButton({

    disabled,
    expanded: [expanded, setExpanded]

}: {

    disabled?: boolean
    expanded: [boolean, Setter<boolean>]

}) {

    return <button type={"button"} disabled={disabled} title={expanded ? "Collapse" : "Expand"}

        onClick={() => setExpanded(!expanded)}

    >{

        expanded ? <ChevronDown/> : <ChevronRight/>

    }</button>;
}


export function NodeItem({

    disabled=false,
    expanded=false,

    rule=false,

    icon,
    name,
    menu,

    href,

    children

}: {

    disabled?: boolean
    expanded?: boolean

    rule?: boolean

    icon?: ReactNode
    name: ReactNode
    menu?: ReactNode

    href?: string

    children?: ReactNode

}) {

    const [expanded_, setExpanded_]=useState(expanded);

    useEffect(() => setExpanded_(expanded), [expanded]);


    return createElement("node-item", {

        disabled: disabled ? "" : undefined,
        expanded: expanded_ ? "" : undefined,

        class: rule ? "rule" : undefined

    }, <>

        <header>

            <nav>{children ? <ToolExpandButton expanded={[expanded_, setExpanded_]}/> : icon}</nav>

            {href ? <a href={href}>{name}</a> : <span>{name}</span>}

            <nav>{menu}</nav>

        </header>

        {expanded_ && children && <section>{children}</section>}

    </>);
}