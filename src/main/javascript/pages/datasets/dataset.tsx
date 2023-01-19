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
import { DataPage } from "@ec2u/data/tiles/page";
import { DataPane } from "@ec2u/data/tiles/pane";
import { immutable } from "@metreeca/core";
import { string } from "@metreeca/link";
import { NodeHint } from "@metreeca/tile/widgets/hint";
import { NodeSpin } from "@metreeca/tile/widgets/spin";
import { useEntry } from "@metreeca/tool/nests/graph";
import { useRoute } from "@metreeca/tool/nests/router";
import * as React from "react";
import { useEffect } from "react";


export const Dataset=immutable({

    id: "/datasets/{code}",

    label: { "en": "Dataset" },
    comment: { "en": "" },

    license: {
        id: "",
        label: { "en": "" }
    },

    rights: "",

    entities: 0

});


export function DataDataset() {

    const [route, setRoute]=useRoute();

    const entry=useEntry(route, Dataset);


    useEffect(() => setRoute({ label: entry({ value: ({ label }) => string(label) }) }));


    return <DataPage item={entry({ value: string })}

        menu={entry({ fetch: <NodeSpin/> })}

        pane={<DataPane

            header={<DataBack>{{ id: "/datasets", label: "Datasets" }}</DataBack>}

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

    id

}: typeof Dataset) {

    return <>

        <DataInfo>{{}}</DataInfo>

    </>;

}

function DataDatasetBody({

    id,
    label,
    comment,

    license,
    rights

}: typeof Dataset) {

    return <DataCard>

        {string(comment)}

        <h1>Licensing</h1>

        <a href={id}>{string(label)} Dataset</a> {rights.replace(/^Copyright\s+/, "")}
        is licensed under <a href={license.id}>{string(license)}</a>.

    </DataCard>;

}
