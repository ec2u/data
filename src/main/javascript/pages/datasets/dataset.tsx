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

import { DatasetsIcon } from "@ec2u/data/pages/datasets/datasets";
import { DataBack } from "@ec2u/data/tiles/back";
import { DataCard } from "@ec2u/data/tiles/card";
import { DataInfo } from "@ec2u/data/tiles/info";
import { DataPage, ec2u } from "@ec2u/data/tiles/page";
import { DataPane } from "@ec2u/data/tiles/pane";
import { immutable } from "@metreeca/core";
import { optional, string } from "@metreeca/core/value";
import { useEntry } from "@metreeca/view/nests/graph";
import { useRoute } from "@metreeca/view/nests/router";
import { NodeHint } from "@metreeca/view/tiles/hint";
import { NodeLink } from "@metreeca/view/tiles/link";
import { NodeMark } from "@metreeca/view/tiles/mark";
import { NodeSpin } from "@metreeca/view/tiles/spin";
import "highlight.js/styles/github.css";
import React, { useEffect } from "react";


export const Dataset=immutable({

    id: "/datasets/{code}",

    label: { "en": "Dataset" },
    comment: optional({ "en": "" }),

    title: { "en": "Dataset" },
    alternative: optional({ "en": "" }),
    description: optional({ "en": "" }),

    license: optional({
        id: "",
        label: { "en": "" }
    }),

    rights: optional(""),
    accessRights: optional({ "en": "" }),

    isDefinedBy: optional(""),

    entities: 0

});


export function DataDataset() {

    const [route, setRoute]=useRoute();

    const entry=useEntry(route, Dataset);


    useEffect(() => setRoute({ label: entry({ value: ({ label }) => string(ec2u(label)) }) }));


    return <DataPage item={entry({ value: ({ title, alternative }) => string(alternative || title) })}

        menu={entry({ fetch: <NodeSpin/> })}

        pane={<DataPane

            header={entry({ value: ({ id, label }) => <DataBack>{{ id, label: ec2u(label) }}</DataBack> })}

        >{entry({

            value: DataDatasetInfo

        })}</DataPane>}

    >{entry({

        fetch: <NodeHint>{DatasetsIcon}</NodeHint>,

        value: DataDatasetBody,

        error: error => <span>{error.status}</span> // !!! report

    })}</DataPage>;

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function DataDatasetInfo({

    entities,

    license,
    rights,

    isDefinedBy


}: typeof Dataset) {

    return <>

        <DataInfo>{{

            "Entities": <span>{string(entities)}</span>

        }}</DataInfo>

        <DataInfo>{{

            "License": license && <NodeLink>{license}</NodeLink>,
            "Rights": rights && <span>{rights}</span>

        }}</DataInfo>

        {isDefinedBy && <>

            <hr/>

            <nav><NodeMark toc>{isDefinedBy}</NodeMark></nav>

        </>}

    </>;

}

function DataDatasetBody({

    description,
    isDefinedBy

}: typeof Dataset) {

    return <DataCard>

        {description && <NodeMark>{string(description)}</NodeMark>}
        {isDefinedBy && <NodeMark>{isDefinedBy}</NodeMark>}

    </DataCard>;

}
