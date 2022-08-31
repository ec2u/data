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

import { DataCard } from "@ec2u/data/tiles/card";
import { DataPage } from "@ec2u/data/tiles/page";
import { DataPane } from "@ec2u/data/tiles/pane";
import { immutable } from "@metreeca/core";
import { string } from "@metreeca/link";
import { NodeCount } from "@metreeca/tile/lenses/count";
import { NodeItems } from "@metreeca/tile/lenses/items";
import { NodeKeywords } from "@metreeca/tile/lenses/keywords";
import { Package } from "@metreeca/tile/widgets/icon";
import { NodeLink } from "@metreeca/tile/widgets/link";
import { NodeSpin } from "@metreeca/tile/widgets/spin";
import { useQuery } from "@metreeca/tool/hooks/query";
import { useEntry } from "@metreeca/tool/nests/graph";
import { useRoute } from "@metreeca/tool/nests/router";
import * as React from "react";
import { useEffect } from "react";


export const SetsIcon=<Package/>;

export const Sets=immutable({

    id: "/",
    label: "Knowledge Hub",


    contains: [{

        id: "",
        label: "",
        comment: "",

        entities: ""

    }]

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function DataSets() {

    const [route, setRoute]=useRoute();

    const [query, setQuery]=useQuery({

        ".order": ["entities", "label"],
        ".limit": 100

    }, sessionStorage);

    const entry=useEntry(route, Sets, query);


    useEffect(() => { setRoute({ label: string(Sets) }); }, []);


    return (

        <DataPage item={string(Sets)}

            menu={entry({ fetch: <NodeSpin/> })}

            pane={<DataPane

                header={<NodeKeywords state={[query, setQuery]}/>}
                footer={<NodeCount state={[query, setQuery]}/>}

            />}

            deps={[JSON.stringify(query)]}

        >

            <NodeItems model={Sets} placeholder={SetsIcon} state={[query, setQuery]}>{({

                id,
                label,
                comment,
                entities

            }) =>

                <DataCard key={id} compact

                    name={<NodeLink>{{ id, label }}</NodeLink>}

                    tags={`${string(entities)} entities`}

                >{

                    string(comment)

                }</DataCard>

            }</NodeItems>

        </DataPage>

    );
}
