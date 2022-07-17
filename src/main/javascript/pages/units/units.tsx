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

import { University } from "@ec2u/data/pages/universities/university";
import { DataCard } from "@ec2u/data/tiles/card";
import { DataPage } from "@ec2u/data/tiles/page";
import { DataPane } from "@ec2u/data/tiles/pane";
import { immutable } from "@metreeca/core";
import { multiple, string } from "@metreeca/link";
import { NodeCount } from "@metreeca/tile/lenses/count";
import { NodeItems } from "@metreeca/tile/lenses/items";
import { NodeKeywords } from "@metreeca/tile/lenses/keywords";
import { NodeOptions } from "@metreeca/tile/lenses/options";
import { FlaskConical } from "@metreeca/tile/widgets/icon";
import { useQuery } from "@metreeca/tool/hooks/query";
import { useEntry } from "@metreeca/tool/nests/graph";
import { useRoute } from "@metreeca/tool/nests/router";
import * as React from "react";
import { useEffect } from "react";


export const UnitsIcon=<FlaskConical/>;

export const Units=immutable({

    id: "/units/",
    label: { "en": "Research Units" },

    contains: multiple({

        id: "",
        label: { "en": "" },
        comment: { "en": "" },

        altLabel: { "en": "" },

        university: {
            id: "",
            label: { "en": "" }
        }

    })
});


export function DataUnits() {

    const [route, setRoute]=useRoute();

    const [query, setQuery]=useQuery({

        ".order": "label",
        ".limit": 20

    }, sessionStorage);


    const entry=useEntry(route, Units, query);


    useEffect(() => { setRoute({ label: string(Units) }); }, []);


    return <DataPage item={string(Units)}

        pane={<DataPane

            header={<NodeKeywords state={[query, setQuery]}/>}
            footer={<NodeCount state={[query, setQuery]}/>}

        >

            <NodeOptions path={"university"} type={"reference"} placeholder={"University"} state={[query, setQuery]}/>

        </DataPane>}

    >

        <NodeItems model={Units} placeholder={UnitsIcon} state={[query, setQuery]}>{({

            id,
            label,
            comment,

            university,
            altLabel

        }) =>

            <DataCard key={id} compact

                name={<a href={id}>{string(label)}</a>}

                tags={<>
                    <span>{string(university)}</span>
                    {altLabel && <>
                        <span> / </span>
                        <span>{string(altLabel)}</span>
                    </>}
                </>}

            >

                {string(comment)}

            </DataCard>

        }</NodeItems>

    </DataPage>;

}
