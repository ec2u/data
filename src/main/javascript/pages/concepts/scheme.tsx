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

import { Schemes, SchemesIcon } from "@ec2u/data/pages/concepts/schemes";
import { DataBack } from "@ec2u/data/tiles/back";
import { DataCard } from "@ec2u/data/tiles/card";
import { DataPage } from "@ec2u/data/tiles/page";
import { DataPane } from "@ec2u/data/tiles/pane";
import { immutable } from "@metreeca/core";
import { multiple, string } from "@metreeca/core/value";
import { useEntry } from "@metreeca/view/nests/graph";
import { useRoute } from "@metreeca/view/nests/router";
import { NodeHint } from "@metreeca/view/tiles/hint";
import { NodeLabel } from "@metreeca/view/tiles/layouts/label";
import { NodeLink } from "@metreeca/view/tiles/link";
import { NodeSpin } from "@metreeca/view/tiles/spin";
import * as React from "react";
import { useEffect } from "react";


export const Scheme=immutable({

    id: "/concepts/{scheme}",

    label: { "en": "Taxonomy" },
    comment: { "en": "" },

    hasTopConcept: multiple({

        id: "",
        label: { "en": "" },

        prefLabel: { "en": "" },
        altLabel: { "en": "" },
        definition: { "en": "" }

    })

});


export function DataScheme() {

    const [route, setRoute]=useRoute();

    const entry=useEntry(route, Scheme);


    useEffect(() => setRoute({ title: entry({ value: ({ label }) => string(label) }) }));


    return <DataPage item={entry({ value: string })}

        menu={entry({ fetch: <NodeSpin/> })}

        pane={<DataPane

            header={<DataBack>{Schemes}</DataBack>}

        >{entry({

            value: event => <DataSchemeInfo>{event}</DataSchemeInfo>

        })}</DataPane>}

    >{entry({

        fetch: <NodeHint>{SchemesIcon}</NodeHint>,

        value: course => <DataSchemaBody>{course}</DataSchemaBody>,

        error: error => <span>{error.status}</span> // !!! report

    })}</DataPage>;

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function DataSchemeInfo({

    children: {}

}: {

    children: typeof Scheme

}) {

    return <>

    </>;
}

function DataSchemaBody({

    children: {

        comment,

        hasTopConcept

    }

}: {

    children: typeof Scheme

}) {

    return <DataCard>

        {comment && <p>{string(comment)}</p>}

        {comment && hasTopConcept?.length && <hr/>}

        {hasTopConcept?.length && <NodeLabel name={"Top Concepts"}>{[...hasTopConcept]

            .sort((x, y) => string(x).localeCompare(string(y)))
            .map(concept => <NodeLink key={concept.id}>{concept}</NodeLink>)

        }</NodeLabel>}

    </DataCard>;

}
