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

import { Immutable, isObject, isString } from "@metreeca/core";
import { Value } from "@metreeca/link";
import { Heart } from "@metreeca/skin/lucide";
import { NodeIcon } from "@metreeca/tile/widgets/icon";
import { NodePath } from "@metreeca/tile/widgets/path";
import { copy } from "@metreeca/tool";
import { useStorage } from "@metreeca/tool/hooks/storage";
import React, { createElement, ReactNode, useState } from "react";
import "./page.css";


export interface Tab {

    name: string;
    icon: ReactNode;
    pane: () => ReactNode;

}

export function isTab(value: unknown): value is Tab {
    return isObject(value) && isString(value.name) && "icon" in value && "pane" in value;
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function DataPage({

    item,
    menu,

    side,
    pane,

    tabs,

    children

}: {

    item?: Value | ReactNode | Immutable<Array<Value | ReactNode>>
    menu?: ReactNode

    side?: ReactNode
    pane?: ReactNode

    tabs?: Immutable<Tab[]>

    children: ReactNode

}) {

    const init=pane ?? tabs?.[0]?.pane();


    const [alternate, setAlternate]=useStorage(localStorage, "data-page-alternate", false);

    const [tray, setTray]=useState(init);


    // !!! useEffect(() => setTray(init), [init]);


    function doToggleTray() {
        setAlternate(!alternate);
    }

    function doSetTray(pane: ReactNode) {
        setAlternate(false);
        setTray(pane);
    }


    return createElement("data-page", {

        class: alternate ? "alternate" : "primary"

    }, <>

        <nav>

            <header>
                <NodeIcon onClick={doToggleTray}/>
            </header>

            <section>{tabs?.map(item =>
                <button key={item.name} title={item.name} onClick={() => doSetTray(item.pane())}>{item.icon}</button>
            )}</section>

            <footer>
                <a target={"_blank"} href={"https://github.com/ec2u/data"}><Heart/></a>
            </footer>

        </nav>

        <aside onClick={e => {

            if ( e.target instanceof Element && e.target.tagName === "A" ) {
                console.log("!!!");
            }

        }}>
            {tray}
        </aside>

        <main>

            <header>
                <NodeIcon onClick={doToggleTray}/>
                <span><NodePath>{item}</NodePath></span>
                <nav>{menu}</nav>
            </header>

            <section>{children}</section>

            <footer>{copy}</footer>

        </main>

    </>);

}