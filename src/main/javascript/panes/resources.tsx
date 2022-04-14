/***********************************************************************************************************************
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
 **********************************************************************************************************************/

import { freeze, string } from "@metreeca/tool/bases";
import { Updater } from "@metreeca/tool/hooks";
import { useEntry } from "@metreeca/tool/hooks/queries/entry";
import { Calendar, Library, MapPin } from "@metreeca/tool/tiles/icon";
import { ToolItem } from "@metreeca/tool/tiles/item";
import { ToolPane } from "@metreeca/tool/tiles/pane";
import * as React from "react";
import { Events } from "../pages/events/events";
import { Universities } from "../pages/universities/universities";


const Resources=freeze({

    id: "/",

    universities: 0,
    events: 0

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function DataResourcesButton({

    onClick

}: {

    onClick: Updater<void>

}) {

    function doActivate(analytics: boolean) {
        if ( analytics ) {

            window.open("/sparql", "_blank");

        } else {

            onClick();

        }
    }

    return <button title={"Resources"}

        onClick={e => doActivate(e.altKey)}

    ><Library/></button>;

}

export function DataResourcesPane() {

    const [{ frame }]=useEntry("/", Resources);

    return <ToolPane

        header={<h1>Connect Centre</h1>}
        // header={<ToolSearch icon rule placeholder={"Search"} value={""} onChange={() => {}}/>}

    >

        <ToolItem icon={<MapPin/>}
            name={<a href={Universities.id}>{string(Universities.label)}</a>}
            menu={frame(({ universities }) => string(universities))}
        />

        <ToolItem icon={<Calendar/>}
            name={<a href={Events.id}>{string(Events.label)}</a>}
            menu={frame(({ events }) => string(events))}
        />

    </ToolPane>;
}
