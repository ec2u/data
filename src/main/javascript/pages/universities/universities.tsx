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
import { Query, string } from "@metreeca/link";
import { NodeSearch } from "@metreeca/tile/inputs/search";
import { NodeHint } from "@metreeca/tile/widgets/hint";
import { Landmark } from "@metreeca/tile/widgets/icon";
import { NodePath } from "@metreeca/tile/widgets/path";
import { NodeSpin } from "@metreeca/tile/widgets/spin";
import { Setter } from "@metreeca/tool/hooks";
import { useParameters } from "@metreeca/tool/hooks/params";
import { useEntry, useKeywords, useStats } from "@metreeca/tool/nests/graph";
import { useRoute } from "@metreeca/tool/nests/router";
import * as React from "react";
import { ReactNode, useEffect } from "react";


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
    const [query, setQuery]=useParameters<Query>({

        ".order": "",
        ".limit": 20

    });

    const entry=useEntry(route, Universities, query);


    useEffect(() => { setRoute({ label: string(Universities) }); }, []);


    return <DataPage item={<NodePath>{Universities}</NodePath>}

        menu={entry({ fetch: <NodeSpin/> })}

        pane={<DataUniversitiesFilters id={route} state={[query, setQuery]}/>}

    >{entry<ReactNode>({

        fetch: <NodeHint>{UniversitiesIcon}</NodeHint>,

        value: ({ contains }) => contains.length === 0

            ? <NodeHint>{UniversitiesIcon}</NodeHint>

            : contains.map(({ id, label, image, comment, country }) => {

                return <DataCard key={id}

                    name={<a href={id}>{string(label)}</a>}
                    icon={image}
                    tags={<span>{string(country.label)}</span>}

                >
                    {string(comment)}

                </DataCard>;

            }),

        error: error => <span>{error.status}</span> // !!! report

    })}</DataPage>;

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function DataUniversitiesFilters({

    id,
    state: [query, setQuery]

}: {

    id: string
    state: [Query, Setter<Query>]

}) {

    const [search, setSearch]=useKeywords(id, "label", [query, setQuery]);

    const stats=useStats("", "", query);

    return <DataPane

        header={<NodeSearch icon placeholder={"Search"}
            auto state={[search, setSearch]}
        />}

        footer={stats({
            value: ({ count }) =>
                count === 0 ? "no matches" : count === 1 ? "1 match" : `${string(count)} matches`
        })}

    />;
}