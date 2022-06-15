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

import { Events } from "@ec2u/data/pages/events/events";
import { Home } from "@ec2u/data/pages/home";
import { Universities } from "@ec2u/data/pages/universities/universities";
import { string } from "@metreeca/link";
import { Calendar, Landmark, Library, Package } from "@metreeca/skin/lucide";
import { NodePane } from "@metreeca/tile/pane";
import { NodeItem } from "@metreeca/tile/widgets/item";
import { NodeLink } from "@metreeca/tile/widgets/link";
import { useEntry } from "@metreeca/tool/nests/graph";
import * as React from "react";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function DataSetsTab() {
    return {

        name: "Resource Library",
        icon: <Library/>,
        pane: () => <DataSetsPane/>

    };
}

export function DataSetsPane() {

    const [entry]=useEntry("/", Home);

    return <NodePane

        header={"Knowledge Hub"}

    >

        <NodeItem icon={<Package/>}
            name={<NodeLink>{Home}</NodeLink>}
            menu={"#"}
        />

        <hr/>

        <NodeItem icon={<Landmark/>}
            name={<NodeLink>{Universities}</NodeLink>}
            menu={entry({ value: ({ universities }) => string(universities) })}
        />

        <NodeItem icon={<Calendar/>}
            name={<a href={Events.id}>{string(Events.label)}</a>}
            menu={entry({ value: ({ events }) => string(events) })}
        />

    </NodePane>;
}
