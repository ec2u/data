/*
 * Copyright © 2020-2022 EC2U Alliance
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

import { Immutable } from "@metreeca/core";
import { Value } from "@metreeca/link";
import { Heart, Menu } from "@metreeca/tile/widgets/icon";
import { NodeIcon } from "@metreeca/tile/widgets/logo";
import { NodePath } from "@metreeca/tile/widgets/path";
import { copy } from "@metreeca/tool";
import React, { createElement, ReactNode, useState } from "react";
import "./page.css";


export function DataPage({

    item,
    menu,

    pane,

    children

}: {

    item?: Value | ReactNode | Immutable<Array<Value | ReactNode>>
    menu?: ReactNode

    pane?: ReactNode

    children: ReactNode

}) {

    const [tray, setTray]=useState(false);


    function doToggleTray() {
        setTray(!tray);
    }


    return createElement("data-page", {

        class: tray ? "tray" : "main",

        onClick: e => {

            if ( e.target instanceof Element && e.target.tagName === "DATA-PAGE" ) { setTray(false); }

        }

    }, <>

        <nav>

            <header>
                <a href={"/"}><NodeIcon/></a>
            </header>

            <section/>

            <footer>
                <a target={"_blank"} href={"https://github.com/ec2u/data"}><Heart/></a>
            </footer>

        </nav>

        <aside onClick={e => {

            if ( e.target instanceof Element && e.target.tagName === "A" ) {
                setTray(false);
            }

        }}>{

            pane

        }</aside>

        <main>

            <header>
                <a href={"/"}><NodeIcon/></a>
                <span><NodePath>{item}</NodePath></span>
                <nav>{menu}</nav>
                <button title={"Open menu"} onClick={doToggleTray}><Menu/></button>
            </header>

            <section>{children}</section>

            <footer>{copy}</footer>

        </main>

    </>);

}