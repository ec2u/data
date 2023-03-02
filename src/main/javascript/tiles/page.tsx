/*
 * Copyright © 2020-2023 EC2U Alliance
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

import { app } from "@metreeca/view";
import { Heart, Menu } from "@metreeca/view/tiles/icon";
import { NodeLogo } from "@metreeca/view/tiles/logo";
import React, { createElement, DependencyList, ReactNode, useEffect, useRef, useState } from "react";
import "./page.css";


export function ec2u(label: { [lang: string]: string }): { [lang: string]: string } { // remove leading alliance name
    return Object.entries(label).reduce((labels, [lang, text]) => ({
        ...labels, [lang]: text.replace(/^EC2U\s+/, "")
    }), {});
}


export function DataPage({

    item,
    menu,

    pane,

    children,
    deps=[]

}: {

    item?: ReactNode
    menu?: ReactNode

    pane?: ReactNode

    children: ReactNode
    deps?: DependencyList

}) {

    const [tray, setTray]=useState(false);


    const main=useRef<HTMLElement>(null);

    useEffect(() => {

        main.current?.scroll(0, 0);

    }, deps);


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
                <a href={"/"}><NodeLogo/></a>
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

        <main ref={main}>

            <header>
                <a href={"/"}><NodeLogo/></a>
                <span>{item}</span>
                <nav>{menu}</nav>
                <button title={"Open menu"} onClick={doToggleTray}><Menu/></button>
            </header>

            <section>{children}</section>

            <footer>{app.copy}</footer>

        </main>

    </>);

}
