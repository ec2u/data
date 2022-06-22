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

import { Events, EventsIcon } from "@ec2u/data/pages/events/events";
import { DataBack } from "@ec2u/data/tiles/back";
import { DataCard } from "@ec2u/data/tiles/card";
import { DataInfo } from "@ec2u/data/tiles/info";
import { DataPage } from "@ec2u/data/tiles/page";
import { DataPane } from "@ec2u/data/tiles/pane";
import { immutable } from "@metreeca/core";
import { multiple, optional, string } from "@metreeca/link";
import { toLocaleDateString } from "@metreeca/tile/inputs/date";
import { toLocaleTimeString } from "@metreeca/tile/inputs/time";
import { NodeHint } from "@metreeca/tile/widgets/hint";
import { NodeLink } from "@metreeca/tile/widgets/link";
import { NodeSpin } from "@metreeca/tile/widgets/spin";
import { useEntry } from "@metreeca/tool/nests/graph";
import { useRoute } from "@metreeca/tool/nests/router";
import * as React from "react";
import { useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";


export const Event=immutable({

    id: "/events/{code}",

    image: "",
    label: { "en": "Event" },
    comment: {},

    university: {
        id: "",
        label: {}
    },

    publisher: {
        id: "",
        label: {}
    },

    subject: multiple({
        id: "",
        label: {}
    }),

    url: optional(""),

    fullDescription: optional(""),

    startDate: optional(""),
    endDate: optional(""),

    isAccessibleForFree: optional(false),

    location: multiple({
        id: "",
        label: {},
        url: optional("")
    }),

    organizer: multiple({
        id: "",
        label: {},
        url: optional("")
    })

});


export function DataEvent() {

    const [route, setRoute]=useRoute();

    const entry=useEntry(route, Event);


    useEffect(() => setRoute({ label: entry({ value: ({ label }) => string(label) }) }));

    return <DataPage item={entry({ value: string })}

        menu={entry({ fetch: <NodeSpin/> })}

        pane={<DataPane

            header={<DataBack>{Events}</DataBack>}

        >{entry({

            value: ({

                university,

                publisher,
                subject,

                url,

                startDate,
                endDate,

                isAccessibleForFree,
                location,
                organizer

            }) => <>

                <DataInfo>{{

                    "University": <NodeLink>{university}</NodeLink>,
                    "Source": url && <a href={url} title={string(publisher)}>{string(publisher)}</a>

                }}</DataInfo>

                <DataInfo>{{

                    "Topic": subject && <ul>{[...subject]
                        .sort((x, y) => string(x).localeCompare(string(y)))
                        .map(({ id, label }) => <li key={id}>{string(label)}</li>)
                    }</ul>

                }}</DataInfo>

                <DataInfo>{{

                    ...(startDate && {
                        "Start Date": toLocaleDateString(new Date(startDate)),
                        "Start Time": toLocaleTimeString(new Date(startDate))

                    }),

                    ...(endDate && endDate !== startDate && {

                        "End Date": endDate?.substring(0, 10) !== startDate?.substring(0, 10) && toLocaleDateString(new Date(endDate)),
                        "End Time": toLocaleTimeString(new Date(endDate))

                    })

                }}</DataInfo>


                <DataInfo>{{

                    "Entry": isAccessibleForFree === true ? "Free"
                        : isAccessibleForFree === false ? "Paid"
                            : undefined,

                    "Location": location && [...location]
                        .sort((x, y) => string(x).localeCompare(string(y)))
                        .map(({ id, label, url }) => url
                            ? <a key={id} href={url}>{string(label)}</a>
                            : <span key={id}>{string(label)}</span>
                        ),

                    "Organizer": organizer && [...organizer]
                        .sort((x, y) => string(x).localeCompare(string(y)))
                        .map(({ id, label, url }) => url
                            ? <a href={url}>{string(label)}</a>
                            : <span>{string(label)}</span>
                        )

                }}</DataInfo>

            </>

        })}</DataPane>}

    >{entry({

        fetch: <NodeHint>{EventsIcon}</NodeHint>,

        value: ({

            image,
            label,

            fullDescription

        }) => (

            <DataCard icon={image && <img src={image} alt={`Image of ${string(label)}`}/>}>

                <ReactMarkdown

                    remarkPlugins={[remarkGfm]}

                >{

                    string(fullDescription)

                }</ReactMarkdown>

            </DataCard>

        ),

        error: error => <span>{error.status}</span> // !!! report

    })}</DataPage>;

}
