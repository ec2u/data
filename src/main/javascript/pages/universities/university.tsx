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

import { Universities, UniversitiesIcon } from "@ec2u/data/pages/universities/universities";
import { DataCard } from "@ec2u/data/tiles/card";
import { DataInfo } from "@ec2u/data/tiles/info";
import { DataPage } from "@ec2u/data/tiles/page";
import { DataPane } from "@ec2u/data/tiles/pane";
import { immutable } from "@metreeca/core";
import { string } from "@metreeca/link";
import { NodeHint } from "@metreeca/tile/widgets/hint";
import { NodeLink } from "@metreeca/tile/widgets/link";
import { NodePath } from "@metreeca/tile/widgets/path";
import { NodeSpin } from "@metreeca/tile/widgets/spin";
import { useEntry } from "@metreeca/tool/nests/graph";
import { useRoute } from "@metreeca/tool/nests/router";
import * as React from "react";
import { useEffect } from "react";


function optional<T>(value: T): undefined | typeof value {
    return value;
}

export const University=immutable({

    id: "/universities/{code}",

    image: "",
    label: { "en": "University" },
    comment: "",

    schac: "",
    lat: 0,
    long: 0,

    inception: optional(""),
    students: optional(0),

    country: optional({
        id: "",
        label: {}
    }),

    location: optional({
        id: "",
        label: {}
    })

});


export function DataUniversity() {

    const [route, setRoute]=useRoute();

    const entry=useEntry(route, University);


    useEffect(() => setRoute({ label: entry({ value: ({ label }) => string(label) }) }));


    return <DataPage

        item={<NodePath>{[Universities, entry({ value: value => value })]}</NodePath>}

        menu={entry({ fetch: <NodeSpin/> })}

        pane={<DataPane>{entry({

            value: ({

                inception,
                students,
                country,
                location

            }) => <DataInfo>{{

                "Inception": inception && inception.substring(0, 4) || "-",
                "Students": students && string(students),

                "Country": country && <NodeLink>{country}</NodeLink>,
                "City": location && <NodeLink>{location}</NodeLink>

            }}</DataInfo>

        })}</DataPane>}

    >{entry({

        fetch: <NodeHint>{UniversitiesIcon}</NodeHint>,

        value: ({

            image, label, comment

        }) => (

            <DataCard

                icon={image && <img src={image} alt={`Image of ${string(label)}`}/>}

            >

                {string(comment)}

            </DataCard>

        ),

        error: error => <span>{error.status}</span> // !!! report

    })}</DataPage>;
}