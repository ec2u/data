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

import { Heart } from "@metreeca/skin/lucide";
import { NodeIcon } from "@metreeca/tile/widgets/icon";
import { copy } from "@metreeca/tool";
import React, { createElement, ReactNode, useState } from "react";
import "./page.css";


export function DataPage({

    item,
    menu,

    side,
    pane,

    children

}: {

    item?: ReactNode
    menu?: ReactNode

    side?: ReactNode
    pane?: ReactNode

    children: ReactNode

}) {

    const [expanded, setExpanded]=useState(false);


    function doToggleSide() {
        setExpanded(!expanded);
    }


    return createElement("data-page", {

        class: expanded ? "expanded" : "collapsed"

    }, <>

        <nav>

            <header>
                <NodeIcon onClick={doToggleSide}/>
            </header>

            <section>{side}</section>

            <footer>
                <a target={"_blank"} href={"https://github.com/ec2u/data#ec2u-knowledge-hub"}><Heart/></a>
            </footer>

        </nav>

        <aside>{pane}</aside>

        <main>

            <header>
                <NodeIcon onClick={doToggleSide}/>
                <span>{item}</span>
                <nav>{menu}</nav>
            </header>

            <section>{children}</section>

            <footer>{copy}</footer>

        </main>

    </>);

}