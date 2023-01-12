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
import { DataPage } from "@ec2u/data/tiles/page";
import { DataPane } from "@ec2u/data/tiles/pane";
import { immutable } from "@metreeca/core";
import { multiple, string } from "@metreeca/link";
import { NodeCount } from "@metreeca/tile/lenses/count";
import { NodeItems } from "@metreeca/tile/lenses/items";
import { NodeKeywords } from "@metreeca/tile/lenses/keywords";
import { GraduationCap } from "@metreeca/tile/widgets/icon";
import { useQuery } from "@metreeca/tool/hooks/query";
import { useRoute } from "@metreeca/tool/nests/router";
import * as React from "react";
import { useEffect } from "react";


export const SchemesIcon=<GraduationCap/>;

export const Schemes=immutable({

    id: "/concepts/",
    label: { "en": "Concept Schemes" },

    contains: multiple({

        id: "",
        label: {},
        comment: {},

        extent: 0,

        university: {
            id: "",
            label: {}
        }

    })

});


export function DataSchemes() {

    const [, setRoute]=useRoute();
    const [query, setQuery]=useQuery({ ".order": ["label"] }, sessionStorage);


    useEffect(() => { setRoute({ label: string(Schemes) }); }, []);


    return <DataPage item={string(Schemes)}

        pane={<DataPane

            header={<NodeKeywords state={[query, setQuery]}/>}
            footer={<NodeCount state={[query, setQuery]}/>}

        >


        </DataPane>}

        deps={[JSON.stringify(query)]}

    >

        <NodeItems model={Schemes} placeholder={SchemesIcon} state={[query, setQuery]}>{({

            id,

            label,
            comment,

            extent

        }) =>

            <DataCard key={id} compact

                name={<a href={id}>{string(label)}</a>}

                tags={`${extent} concepts`}

            >

                {string(comment)}

            </DataCard>

        }</NodeItems>

    </DataPage>;

}

