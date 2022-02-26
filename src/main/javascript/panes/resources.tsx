/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

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
