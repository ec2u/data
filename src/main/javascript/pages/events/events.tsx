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
import { Query, string } from "@metreeca/link";
import { NodeSearch } from "@metreeca/tile/inputs/search";
import { NodeStats } from "@metreeca/tile/lenses/stats";
import { NodeTerms } from "@metreeca/tile/lenses/terms";
import { NodePath } from "@metreeca/tile/widgets/path";
import { NodeSpin } from "@metreeca/tile/widgets/spin";
import { Setter } from "@metreeca/tool/hooks";
import { useParameters } from "@metreeca/tool/hooks/parameters";
import { useEntry, useKeywords, useStats } from "@metreeca/tool/nests/graph";
import { useRoute } from "@metreeca/tool/nests/router";
import * as React from "react";
import { useEffect } from "react";


export const Events=immutable({

    id: "/events/",
    label: { "en": "Events" },

    contains: [{

        id: "",
        image: "",
        label: {},
        comment: {},

        university: {
            id: "",
            label: {}
        },

        startDate: "",
        endDate: ""

    }]

});


export function DataEvents() {

    const [route, setRoute]=useRoute();

    const [query, setQuery]=useParameters<Query>({

        ".order": "startDate",
        ".limit": 20

    });

    const [entry]=useEntry(route, Events, [query, setQuery]);


    useEffect(() => { setRoute({ label: string(Events) }); }, []);


    return <DataPage item={<NodePath>{Events}</NodePath>}

        menu={entry({ fetch: <NodeSpin/> })}

        pane={<DataEventsFilters id={route} state={[query, setQuery]}/>}

    >{entry({

        value: ({ contains }) => contains.map(({ id, label, image, comment, university, startDate }) => (

            <DataCard key={id}

                name={<a href={id}>{string(label)}</a>}

                icon={image?.[0]}

                tags={<>
                    <span>{string(university)}</span>
                    {startDate && <>
                        <span> / </span>
                        <span>{startDate.substring(0, 10)}</span>
                    </>}
                </>}

            >

                {string(comment)}

            </DataCard>

        )),

        error: error => [<span>{error.status}</span>]

    })}</DataPage>;

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function DataEventsFilters({

    id,

    state: [query, setQuery]

}: {

    id: string

    state: [Query, Setter<Query>]

}) {

    const [keywords, setKeywords]=useKeywords(id, "label", [query, setQuery]);

    const [stats]=useStats("", "", [query, setQuery]);

    return <DataPane

        header={<NodeSearch icon placeholder={"Search"}
            auto state={[keywords, setKeywords]}
        />}

        footer={stats({

            value: ({ count }) => count === 0 ? "no matches" : count === 1 ? "1 match" : `${string(count)} matches`

        })}

    >

        <NodeTerms id={id} path={"university"} compact placeholder={"University"} state={[query, setQuery]}/>
        <NodeTerms id={id} path={"publisher"} compact placeholder={"Publisher"} state={[query, setQuery]}/>

        <NodeStats id={id} path={"startDate"} pattern={/\d{4}-\d{2}-\d{2}/} state={[query, setQuery]}/>

    </DataPane>;
}