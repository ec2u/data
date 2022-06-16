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

import { Universities } from "@ec2u/data/pages/universities/universities";
import { DataCard } from "@ec2u/data/tiles/card";
import { DataPage } from "@ec2u/data/tiles/page";
import { DataPane } from "@ec2u/data/tiles/pane";
import { immutable } from "@metreeca/core";
import { string } from "@metreeca/link";
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

    const [entry]=useEntry(route, University);


    useEffect(() => setRoute({ label: entry({ value: ({ label }) => string(label) }) }));


    return <DataPage

        item={<NodePath>{[Universities, entry({ value: value => value })]}</NodePath>}

        menu={entry({ fetch: <NodeSpin/> })}

        pane={<DataPane>{entry({

            value: ({

                inception, students,
                country, location

            }) => <dl>

                <dt>Inception</dt>
                <dd>{inception && inception.substring(0, 4) || "-"}</dd>

                <dt>Country</dt>
                <dd>{country && <a href={country.id}>{string(country.label)}</a>}</dd>

                <dt>City</dt>
                <dd>{location && <a href={location.id}>{string(location.label)}</a>}</dd>

                {students && <>
                    <dt>Students</dt>
                    <dd>{string(students)}</dd>
                </>}

            </dl>


        })}</DataPane>}

    >{entry({

        value: ({

            image, label, comment

        }) => (

            <DataCard

                icon={image && <img src={image} alt={`Image of ${string(label)}`}/>}

            >

                <p>{string(comment)}</p>

            </DataCard>

        ),

        error: error => <span>{error.status}</span> /* !!! report */

    })}</DataPage>;
}