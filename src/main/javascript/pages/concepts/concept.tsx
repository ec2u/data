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

import { SchemesIcon } from "@ec2u/data/pages/concepts/schemes";
import { DataBack } from "@ec2u/data/tiles/back";
import { DataCard } from "@ec2u/data/tiles/card";
import { DataPage } from "@ec2u/data/tiles/page";
import { DataPane } from "@ec2u/data/tiles/pane";
import { immutable } from "@metreeca/core";
import { multiple, string } from "@metreeca/link";
import { NodeHint } from "@metreeca/tile/widgets/hint";
import { NodeLink } from "@metreeca/tile/widgets/link";
import { NodeSpin } from "@metreeca/tile/widgets/spin";
import { useEntry } from "@metreeca/tool/nests/graph";
import { useRoute } from "@metreeca/tool/nests/router";
import * as React from "react";
import { useEffect } from "react";


export const Concept=immutable({

    id: "/concepts/{scheme}/{id}",
    label: { "en": "Concept Scheme" },
    comment: { "en": "" },

    inScheme: {
        id: "",
        label: { "en": "" }
    },

    broaderTransitive: multiple({

        id: "",
        label: { "en": "" }

    }),

    broader: multiple({

        id: "",
        label: { "en": "" }

    }),

    narrower: multiple({

        id: "",
        label: { "en": "" }

    }),

    related: multiple({

        id: "",
        label: { "en": "" }

    })

});


export function DataConcept() {

    const [route, setRoute]=useRoute();

    const entry=useEntry(route, Concept);


    useEffect(() => setRoute({ label: entry({ value: ({ label }) => string(label) }) }));


    return <DataPage item={entry({ value: string })}

        menu={entry({ fetch: <NodeSpin/> })}

        pane={<DataPane

            header={entry({

                value: ({ inScheme }) => <DataBack>{inScheme}</DataBack>

            })}

        >{entry({

            value: event => <DataConceptInfo>{event}</DataConceptInfo>

        })}</DataPane>}

    >{entry({

        fetch: <NodeHint>{SchemesIcon}</NodeHint>,

        value: course => <DataConceptsBody>{course}</DataConceptsBody>,

        error: error => <span>{error.status}</span> // !!! report

    })}</DataPage>;

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function DataConceptInfo({

    children: {}

}: {

    children: typeof Concept

}) {

    return <>

    </>;
}

function DataConceptsBody({

    children: {

        comment,

        broader,
        narrower,
        related

    }

}: {

    children: typeof Concept

}) {

    return <DataCard>

        {broader && broader.length && <>

            <h1>Broader</h1>

            <ul>{broader.map(concept =>
                <li key={concept.id}><NodeLink>{concept}</NodeLink></li>
            )}</ul>

        </>}

        {narrower && narrower.length && <>

            <h1>Narrower</h1>

            <ul>{narrower.map(concept =>
                <li key={concept.id}><NodeLink>{concept}</NodeLink></li>
            )}</ul>

        </>}

    </DataCard>;

}
