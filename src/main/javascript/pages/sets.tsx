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
import { DataFiltersTab } from "@ec2u/data/panes/filters";
import { DataSetsTab } from "@ec2u/data/panes/sets";
import { DataPage } from "@ec2u/data/tiles/page";
import { immutable } from "@metreeca/core";
import { Query, string } from "@metreeca/link";
import { Home as Site } from "@metreeca/skin/lucide";
import { NodeSearch } from "@metreeca/tile/inputs/search";
import { NodePane } from "@metreeca/tile/pane";
import { NodePath } from "@metreeca/tile/widgets/path";
import { Setter } from "@metreeca/tool/hooks";
import { useParameters } from "@metreeca/tool/hooks/parameters";
import { useEntry, useKeywords, useStats } from "@metreeca/tool/nests/graph";
import { useRoute } from "@metreeca/tool/nests/router";
import * as React from "react";
import { useEffect } from "react";


export const Sets=immutable({

    id: "/",
    label: "Datasets",

    universities: 0,
    events: 0

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export default function DataSets() {

    const [route, setRoute]=useRoute();

    const [query, setQuery]=useParameters<Query>({

        ".order": "label",
        ".limit": 100

    });

    const [entry]=useEntry(route, Sets, [query, setQuery]);


    useEffect(() => { setRoute({ label: string(Events) }); }, []);


    return (

        <DataPage item={<NodePath>{Sets}</NodePath>}

            menu={<a href={"https://ec2u.eu/"} target={"_blank"} title={`About EC2U`}><Site/></a>}


            tabs={[
                DataSetsTab(),
                DataFiltersTab(() => <DataSetsFilters id={route} state={[query, setQuery]}/>)
            ]}

            pane={<DataSetsFilters id={route} state={[query, setQuery]}/>}

        >

            <img src={"/blobs/ec2u.png"} alt={"EC2U Locations"} style={{ width: "100%", maxWidth: "50em" }}/>

        </DataPage>

    );
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function DataSetsFilters({

    id,
    state: [query, setQuery]

}: {

    id: string
    state: [Query, Setter<Query>]

}) {

    const [search, setSearch]=useKeywords(id, "label", [query, setQuery]);

    const [stats]=useStats("", "", [query, setQuery]);

    return <NodePane

        header={<NodeSearch icon placeholder={"Search"}
            auto state={[search, setSearch]}
        />}

        footer={stats({
            value: ({ count }) =>
                count === 0 ? "no matches" : count === 1 ? "1 match" : `${string(count)} matches`
        })}

    >

        <p>facets…</p>


    </NodePane>;
}