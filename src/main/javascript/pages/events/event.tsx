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
import { DataCard } from "@ec2u/data/tiles/card";
import { DataPage } from "@ec2u/data/tiles/page";
import { immutable } from "@metreeca/core";
import { string } from "@metreeca/link";
import { NodeHint } from "@metreeca/tile/widgets/hint";
import { NodeLink } from "@metreeca/tile/widgets/link";
import { NodeSpin } from "@metreeca/tile/widgets/spin";
import { useEntry } from "@metreeca/tool/nests/graph";
import { useRoute } from "@metreeca/tool/nests/router";
import * as React from "react";
import { useEffect } from "react";


export const Event=immutable({

    id: "/events/{code}",

    image: "",
    label: { "en": "Event" },
    comment: {},

    university: {
        id: "",
        label: {}
    },

    fullDescription: {},

    startDate: "",
    endDate: ""

});


export function DataEvent() {

    const [route, setRoute]=useRoute();

    const [entry]=useEntry(route, Event);


    useEffect(() => setRoute({ label: entry({ value: ({ label }) => string(label) }) }));

    return <DataPage item={[Events, entry({ value: value => value })]}

        menu={entry({ fetch: <NodeSpin/> })}

    >{entry({

        fetch: <NodeHint>{EventsIcon}</NodeHint>,

        value: ({

            image,
            label,
            comment,

            university,

            fullDescription,

            startDate,
            endDate

        }) => (

            <DataCard

                icon={image && <img src={image} alt={`Image of ${string(label)}`}/>}

                info={<dl>

                    <dt>University</dt>
                    <dd><NodeLink>{university}</NodeLink></dd>

                    <dt>Start Date</dt>
                    <dd>{startDate}</dd>

                    <dt>End Date</dt>
                    <dd>{endDate}</dd>

                </dl>}

            >

                <p>{string(fullDescription)}</p>

            </DataCard>

        ),

        error: error => <span>{error.status}</span> // !!! report


    })}</DataPage>;

}
