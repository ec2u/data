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

import { DataCard } from "@ec2u/data/tiles/card";
import { DataMeta } from "@ec2u/data/tiles/meta";
import { DataPage } from "@ec2u/data/tiles/page";
import { DataPane } from "@ec2u/data/tiles/pane";
import { immutable } from "@metreeca/core";
import { string } from "@metreeca/link";
import { NodeCount } from "@metreeca/tile/lenses/count";
import { NodeItems } from "@metreeca/tile/lenses/items";
import { NodeKeywords } from "@metreeca/tile/lenses/keywords";
import { NodeRange } from "@metreeca/tile/lenses/range";
import { Landmark } from "@metreeca/tile/widgets/icon";
import { useQuery } from "@metreeca/tool/hooks/query";
import { useRoute } from "@metreeca/tool/nests/router";
import * as React from "react";
import { useEffect } from "react";


export const UniversitiesIcon=<Landmark/>;

export const Universities=immutable({

    id: "/universities/",

    label: {
        "en": "Universities"
    },

    contains: [{

        id: "",
        image: "",

        label: {},
        comment: {},

        country: {
            id: "",
            label: {}
        }

    }]

});


export function DataUniversities() {

    const [route, setRoute]=useRoute();
    const [query, setQuery]=useQuery({ /*".order": "label"*/ }, sessionStorage); // !!! broken multilingual sorting


    useEffect(() => { setRoute({ label: string(Universities) }); }, []);


    return <DataPage item={string(Universities)}

        menu={<DataMeta>{route}</DataMeta>}

        pane={<DataPane

            header={<NodeKeywords state={[query, setQuery]}/>}
            footer={<NodeCount state={[query, setQuery]}/>}

        >

            <NodeRange path={"inception"} type={"dateTime"} as={"gYear"} placeholder={"Inception"} state={[query, setQuery]}/>
            <NodeRange path={"students"} type={"decimal"} as={"integer"} placeholder={"Students"} state={[query, setQuery]}/>

        </DataPane>}

        deps={[JSON.stringify(query)]}

    >

        <NodeItems model={Universities} placeholder={UniversitiesIcon} state={[query, setQuery]}>{({

            id,
            label,
            comment,
            image,

            country

        }) =>

            <DataCard key={id} compact

                name={<a href={id}>{string(label)}</a>}
                icon={image}
                tags={<span>{string(country.label)}</span>}

            >
                {string(comment)}

            </DataCard>

        }</NodeItems>

    </DataPage>;

}