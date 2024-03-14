/*
 * Copyright © 2020-2024 EC2U Alliance
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
import { DataBack } from "@ec2u/data/views/_back";
import { DataCard } from "@ec2u/data/views/_card";
import { DataInfo } from "@ec2u/data/views/_info";
import { DataPage } from "@ec2u/data/views/page";
import { DataPane } from "@ec2u/data/views/pane";
import { immutable } from "@metreeca/core";
import { toIRIString } from "@metreeca/core/_iri";
import { multiple, optional, string } from "@metreeca/core/value";
import { useEntry } from "@metreeca/view/nests/graph";
import { useRoute } from "@metreeca/view/nests/router";
import { NodeHint } from "@metreeca/view/tiles/hint";
import { toLocaleDateString } from "@metreeca/view/tiles/inputs/date";
import { toLocaleTimeString } from "@metreeca/view/tiles/inputs/time";
import { NodeLink } from "@metreeca/view/tiles/link";
import { NodeSpin } from "@metreeca/view/tiles/spin";
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

    source: optional(""),


    name: { "en": "" },
    url: multiple(""),

    fullDescription: optional(""),

    startDate: optional(""),
    endDate: optional(""),

    subject: multiple({
        id: "",
        label: { "en": "" }
    }),

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


    useEffect(() => setRoute({ title: entry({ value: ({ label }) => string(label) }) }));


    return <DataPage item={entry({ value: string })}

        menu={entry({ fetch: <NodeSpin/> })}

        pane={<DataPane

            header={<DataBack>{Events}</DataBack>}

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
        publisher,
        source,

        name,
        url,

        startDate,
        endDate,

        subject,

        isAccessibleForFree,
        location,
        organizer

    }

}: {

    children: typeof Event

}) {

    return <>

        <DataInfo>{{

            "University": <NodeLink>{university}</NodeLink>,
            "Source": source
                ? <a href={source} title={string(publisher)}>{string(publisher)}</a>
                : <span title={string(publisher)}>{string(publisher)}</span>

        }}</DataInfo>

        <DataInfo>{{

            "Title": <span title={string(name)}>{string(name)}</span>,

            "Topics": subject && subject.length && <ul>{[...subject]
                .sort((x, y) => string(x).localeCompare(string(y)))
                .map(subject => <li key={subject.id}>
                    <NodeLink search={[Events, { university, subject }]}>{subject}</NodeLink>
                </li>)
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
                    ? <a key={id} href={url}>{string(label)}</a>
                    : <span key={id}>{string(label)}</span>
                ),

            "Info": url && url.map(item => <a key={item} href={item}>{toIRIString(item)}</a>)

        }}</DataInfo>

    </>;

}

function DataEventBody({

    children: {

        image,
        label,

        fullDescription

    }

}: {

    children: typeof Event

}) {

    return <DataCard icon={image && <img src={image} alt={`Image of ${string(label)}`}/>}>

        <ReactMarkdown

            remarkPlugins={[remarkGfm]}

        >{

            string(fullDescription)

        }</ReactMarkdown>

    </DataCard>;

}
