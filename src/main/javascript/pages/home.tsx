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

import { Events } from "@ec2u/data/pages/events/events";
import { DataCard } from "@ec2u/data/tiles/card";
import { DataPage } from "@ec2u/data/tiles/page";
import { DataPane } from "@ec2u/data/tiles/pane";
import { immutable } from "@metreeca/core";
import { Query, string } from "@metreeca/link";
import { NodeSearch } from "@metreeca/tile/inputs/search";
import { NodeCount } from "@metreeca/tile/lenses/count";
import { NodeLink } from "@metreeca/tile/widgets/link";
import { NodeSpin } from "@metreeca/tile/widgets/spin";
import { Setter } from "@metreeca/tool/hooks";
import { useParameters } from "@metreeca/tool/hooks/params";
import { useEntry, useKeywords } from "@metreeca/tool/nests/graph";
import { useRoute } from "@metreeca/tool/nests/router";
import * as React from "react";
import { ReactNode, useEffect } from "react";


export const Home=immutable({

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

export default function DataHome() {

    const [route, setRoute]=useRoute();
    const [query, setQuery]=useParameters<Query>({

        ".order": "entities",
        ".limit": 100

    }, sessionStorage);

    const entry=useEntry(route, Home, query);


    useEffect(() => { setRoute({ label: string(Events) }); }, []);


    return (

        <DataPage item={Home}

            menu={entry({ fetch: <NodeSpin/> })}

            pane={<DataHomeFilters id={route} state={[query, setQuery]}/>}

        >{entry<ReactNode>({

            value: ({ contains }) => contains.map(dataset => <DataCard

                key={dataset.id} name={<NodeLink>{dataset}</NodeLink>}

                tags={`${string(dataset.entities)} entities`}

            >{string(dataset.comment)}</DataCard>),


            error: error => <span>{error.status}</span> // !!! report

        })}</DataPage>

    );
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function DataHomeFilters({

    id,
    state: [query, setQuery]

}: {

    id: string
    state: [Query, Setter<Query>]

}) {

    const [search, setSearch]=useKeywords(id, "label", [query, setQuery]);

    return <DataPane

        header={<NodeSearch icon placeholder={"Search"} auto state={[search, setSearch]}/>}
        footer={<NodeCount id={id} state={[query, setQuery]}/>}

    />;

}