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
import { immutable } from "@metreeca/core";
import { label, Query, string } from "@metreeca/link";
import { NodePath } from "@metreeca/tile/widgets/path";
import { NodeSpin } from "@metreeca/tile/widgets/spin";
import { useParameters } from "@metreeca/tool/hooks/parameters";
import { useEntry } from "@metreeca/tool/nests/graph";
import { useRoute } from "@metreeca/tool/nests/router";
import * as React from "react";
import { ReactNode, useEffect } from "react";
import { DataPage } from "../../tiles/page";


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

    const [entry]=useEntry(route, Universities, [query, setQuery]);

    useEffect(() => { setRoute({ label: label(Universities) }); }, []);


    return <DataPage item={<NodePath>{Universities}</NodePath>}

        menu={entry({ fetch: <NodeSpin/> })}

    >{entry<ReactNode>({

        value: ({ contains }) => contains.map(({ id, label, image, comment, country }) => {

            return <DataCard key={id}

                name={<a href={id}>{string(label)}</a>}
                icon={image}
                tags={<span>{string(country.label)}</span>}

            >
                {string(comment)}

            </DataCard>;

        }),

        error: error => <span>{error.status}</span> /* !!! report */

    })}</DataPage>;

}
