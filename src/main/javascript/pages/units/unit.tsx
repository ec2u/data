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

import { EventsIcon } from "@ec2u/data/pages/events/events";
import { Units } from "@ec2u/data/pages/units/units";
import { DataBack } from "@ec2u/data/tiles/back";
import { DataCard } from "@ec2u/data/tiles/card";
import { DataInfo } from "@ec2u/data/tiles/info";
import { DataPage } from "@ec2u/data/tiles/page";
import { DataPane } from "@ec2u/data/tiles/pane";
import { immutable } from "@metreeca/core";
import { optional, string } from "@metreeca/link";
import { NodeHint } from "@metreeca/tile/widgets/hint";
import { NodeLink } from "@metreeca/tile/widgets/link";
import { NodeSpin } from "@metreeca/tile/widgets/spin";
import { useEntry } from "@metreeca/tool/nests/graph";
import { useRoute } from "@metreeca/tool/nests/router";
import * as React from "react";
import { useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";


export const Unit=immutable({

    id: "/units/{code}",

    label: { "en": "Research Unit" },
    comment: { "en": "" },

    university: {
        id: "",
        label: { "en": "" }
    },

    altLabel: optional({ "en": "" }),

    classification: optional({
        id: "",
        label: { "en": "" }
    }),

    head: optional({
        id: "",
        label: { "en": "" }
    })

});


export function DataUnit() {

    const [route, setRoute]=useRoute();

    const entry=useEntry(route, Unit);


    useEffect(() => setRoute({ label: entry({ value: ({ label }) => string(label) }) }));


    return <DataPage item={entry({ value: string })}

        menu={entry({ fetch: <NodeSpin/> })}

        pane={<DataPane

            header={<DataBack>{Units}</DataBack>}

        >{entry({

            value: event => <DataEventInfo>{event}</DataEventInfo>

        })}</DataPane>}

    >{entry({

        fetch: <NodeHint>{EventsIcon}</NodeHint>,

        value: event => <DataEventBody>{event}</DataEventBody>,

        error: error => <span>{error.status}</span> // !!! report

    })}</DataPage>;

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function DataEventInfo({

    children: {

        university,

        label,
        altLabel,

        classification,
        head

    }

}: {

    children: typeof Unit

}) {

    return <>

        <DataInfo>{{

            "University": <NodeLink>{university}</NodeLink>,
            "Type": classification && <span>{string(classification)}</span>

        }}</DataInfo>

        <DataInfo>{{

            "Acronym": altLabel && <span>{string(altLabel)}</span>,
            "Name": <span>{string(label)}</span>,
            "Head": head && <span>{string(head)}</span>

        }}</DataInfo>

    </>;
}

function DataEventBody({

    children: {

        comment

    }

}: {

    children: typeof Unit

}) {

    return <DataCard>

        <ReactMarkdown

            remarkPlugins={[remarkGfm]}

        >{

            string(comment)

        }</ReactMarkdown>

    </DataCard>;

}
