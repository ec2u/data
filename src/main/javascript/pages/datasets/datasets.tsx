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
import { DataPage, ec2u } from "@ec2u/data/tiles/page";
import { DataPane } from "@ec2u/data/tiles/pane";
import { immutable } from "@metreeca/core";
import { optional, string } from "@metreeca/link";
import { NodeCount } from "@metreeca/tile/lenses/count";
import { NodeItems } from "@metreeca/tile/lenses/items";
import { NodeKeywords } from "@metreeca/tile/lenses/keywords";
import { NodeOptions } from "@metreeca/tile/lenses/options";
import { Info, Package } from "@metreeca/tile/widgets/icon";
import { NodeLink } from "@metreeca/tile/widgets/link";
import { useQuery } from "@metreeca/tool/hooks/query";
import { useRoute } from "@metreeca/tool/nests/router";
import * as React from "react";
import { useEffect } from "react";


export const DatasetsIcon=<Package/>;

export const Datasets=immutable({

    id: "/",

    label: {
        "en": "Knowledge Hub"
    },

    contains: [{

        id: "",
        label: { en: "" },
        comment: optional({ en: "" }),

        entities: ""

    }]

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function DataDatasets() {

    const [, setRoute]=useRoute();

    const [query, setQuery]=useQuery({

        ".order": ["entities", "label"],
        ".limit": 100

    }, sessionStorage);


    useEffect(() => { setRoute({ label: string(Datasets) }); }, []);


    return (

        <DataPage item={string(Datasets)}

            menu={<a href={"/datasets"}><Info/></a>}

            pane={<DataPane

                header={<NodeKeywords state={[query, setQuery]}/>}
                footer={<NodeCount state={[query, setQuery]}/>}

            >

                <NodeOptions path={"license"} type={"anyURI"} placeholder={"License"} state={[query, setQuery]}/>

            </DataPane>}

            deps={[JSON.stringify(query)]}

        >

            <NodeItems model={Datasets} placeholder={DatasetsIcon} state={[query, setQuery]}>{({

                id,
                label,
                comment,
                entities

            }) =>

                <DataCard key={id} compact

                    name={<NodeLink>{{ id, label: ec2u(label) }}</NodeLink>}

                    tags={`${string(entities)} entities`}

                >{

                    string(comment)

                }</DataCard>

            }</NodeItems>

        </DataPage>

    );
}
