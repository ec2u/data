/*
 * Copyright © 2020-2023 EC2U Alliance
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
import { DataBack } from "@ec2u/data/tiles/back";
import { DataCard } from "@ec2u/data/tiles/card";
import { DataInfo } from "@ec2u/data/tiles/info";
import { DataPage, ec2u } from "@ec2u/data/tiles/page";
import { DataPane } from "@ec2u/data/tiles/pane";
import { immutable } from "@metreeca/core";
import { Focus, multiple, string } from "@metreeca/link";
import { NodeHint } from "@metreeca/tile/widgets/hint";
import { NodeLink } from "@metreeca/tile/widgets/link";
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
    }),

    extent: multiple({

        dataset: {

            id: "",
            label: { "en": "" }

        },

        entities: 0

    })

});


export function DataUniversity() {

    const [route, setRoute]=useRoute();

    const entry=useEntry(route, University);


    useEffect(() => setRoute({ label: entry({ value: ({ label }) => string(label) }) }));


    return <DataPage item={entry({ value: string })}

        menu={entry({ fetch: <NodeSpin/> })}

        pane={<DataPane

            header={<DataBack>{Universities}</DataBack>}

        >{entry({

            value: DataUniversityInfo

        })}</DataPane>}

    >{entry({

        fetch: <NodeHint>{UniversitiesIcon}</NodeHint>,

        value: DataUniversityBody,

        error: error => <span>{error.status}</span> // !!! report

    })}</DataPage>;

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function DataUniversityInfo({

    id,

    inception,
    students,
    country,
    location,
    extent

}: typeof University) {

    return <>

        <DataInfo>{{

            "Country": country && <NodeLink>{country}</NodeLink>,
            "City": location && <NodeLink>{location}</NodeLink>

        }}</DataInfo>

        <DataInfo>{{

            "Inception": inception && inception.substring(0, 4) || "-",
            "Students": students && string(students)

        }}</DataInfo>

        <DataInfo>{extent?.slice()

            ?.sort(({ entities: x }, { entities: y }) => x-y)
            ?.map(({ dataset, entities }) => {

                return ({

                    label: <NodeLink search={[(dataset), { university: id }]}>{{
                        id: dataset.id,
                        label: ec2u(dataset.label)
                    } as Focus}</NodeLink>,
                    value: string(entities)

                });
            })

        }</DataInfo>

    </>;

}

function DataUniversityBody({

    image,
    label,
    comment

}: typeof University) {

    return <DataCard

        icon={image && <img src={image} alt={`Image of ${string(label)}`}/>}

    >

        {string(comment)}

    </DataCard>;

}
