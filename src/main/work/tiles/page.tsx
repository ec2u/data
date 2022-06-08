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

import { useProp } from "@metreeca/tool/hooks/prop";
import { ToolPage } from "@metreeca/tool/tiles/page";
import * as React from "react";
import { ReactNode } from "react";
import { Home } from "../pages/home";
import { DataResourcesButton, DataResourcesPane } from "../panes/resources";


const ResourcesPane: ReactNode=<DataResourcesPane/>;


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

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

    const [active, setActive]=useProp(pane || ResourcesPane); // ;( use constant to avoid infinite useEffect loops


    return <ToolPage

        item={<><a href={Home.id}>EC2U</a> {typeof item === "string" ? <span>{item}</span> : item}</>}

        menu={menu}

        side={<>
            <DataResourcesButton onClick={() => setActive(<DataResourcesPane/>)}/>
            {side}
        </>}

        pane={active}

    >

        {children}

    </ToolPage>;

}


