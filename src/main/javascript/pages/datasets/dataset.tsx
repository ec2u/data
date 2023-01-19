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
import { optional, string } from "@metreeca/link";
import { NodeHint } from "@metreeca/tile/widgets/hint";
import { NodeLink } from "@metreeca/tile/widgets/link";
import { NodeSpin } from "@metreeca/tile/widgets/spin";
import { useEntry } from "@metreeca/tool/nests/graph";
import { useRoute } from "@metreeca/tool/nests/router";
import * as React from "react";
import { useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";


export const Dataset=immutable({

    id: "/datasets/{code}",

    label: { "en": "Dataset" },
    comment: { "en": "" },

    license: optional({
        id: "",
        label: { "en": "" }
    }),

    rights: optional(""),
    accessRights: optional({ "en": "" }),

    entities: 0,

    abstract: optional({ "en": "" }),
    references: optional("")

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

    entities,

    license,
    rights

}: typeof Dataset) {

    return <>

        <DataInfo>{{

            "Entities": <span>{string(entities)}</span>

        }}</DataInfo>

        <DataInfo>{{

            "License": license && <NodeLink>{license}</NodeLink>,
            "Rights": rights && <span>{rights}</span>

        }}</DataInfo>

    </>;

}

function DataDatasetBody({

    label,
    comment,
    abstract,
    references

}: typeof Dataset) {

    return <DataCard>

        <p>{string(comment)}</p>

        {references && <img alt={`${string(label)} Data Model`} src={references} style={{ maxWidth: "80%" }}/>}
        {abstract && <ReactMarkdown remarkPlugins={[remarkGfm]}>{string(abstract)}</ReactMarkdown>} {/* !!! factor */}

    </DataCard>;

}
