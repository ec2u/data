/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

import { freeze, string } from "@metreeca/tool/bases";
import { Updater } from "@metreeca/tool/hooks";
import { useEntry } from "@metreeca/tool/hooks/queries/entry";
import { root } from "@metreeca/tool/nests/router";
import { Database, Library, MapPin } from "@metreeca/tool/tiles/icon";
import { ToolItem } from "@metreeca/tool/tiles/item";
import { ToolPane } from "@metreeca/tool/tiles/pane";
import * as React from "react";
import { ReactNode } from "react";
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

    onClick: Updater<ReactNode>

}) {

    return <button title={"Resources"}
        onClick={e => onClick(e.altKey ? <DataHiddenPane/> : <DataResourcesPane/>)}
    ><Library/></button>;

}

export function DataResourcesPane() {

    const [{ frame }]=useEntry("/", Resources);

    return <ToolPane

        header={<h1>EC2U Connect Centre</h1>}
        // header={<ToolSearch icon rule placeholder={"Search"} value={""} onChange={() => {}}/>}

    >

        <ToolItem icon={<MapPin/>}
            name={<a href={Universities.id}>{string(Universities.label)}</a>}
            menu={frame(({ universities }) => string(universities))}
        />

        {/*<ToolItem icon={<Calendar/>}
         name={<a href={Events.id}>{string(Events.label)}</a>}
         menu={frame(({ events }) => string(events))}
         />*/}

    </ToolPane>;
}

export function DataHiddenPane() {
    return <ToolPane>
        <ToolItem icon={<Database/>}
            name={<a href={`https://apps.metreeca.com/self/#endpoint=${root}sparql`} target={"_blank"}>SPARQL</a>}
        />
    </ToolPane>;
}
