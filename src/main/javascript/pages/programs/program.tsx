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

import { CoursesIcon } from "@ec2u/data/pages/courses/courses";
import { Programs } from "@ec2u/data/pages/programs/programs";
import { DataBack } from "@ec2u/data/tiles/back";
import { DataCard } from "@ec2u/data/tiles/card";
import { DataInfo } from "@ec2u/data/tiles/info";
import { DataPage } from "@ec2u/data/tiles/page";
import { DataPane } from "@ec2u/data/tiles/pane";
import { immutable } from "@metreeca/core";
import { multiple, optional, string } from "@metreeca/core/value";
import { useEntry } from "@metreeca/view/nests/graph";
import { useRoute } from "@metreeca/view/nests/router";
import { NodeHint } from "@metreeca/view/tiles/hint";
import { NodeLink } from "@metreeca/view/tiles/link";
import { NodeSpin } from "@metreeca/view/tiles/spin";
import * as React from "react";
import { Fragment, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";


export const Program=immutable({

    id: "/programs/{code}",

    image: "",
    label: { "en": "Program" },
    comment: { "en": "" },

    university: {
        id: "",
        label: { "en": "" }
    },

    provider: optional({
        id: "",
        label: { "en": "" }
    }),

    identifier: optional(""),
    url: multiple(""),

    numberOfCredits: optional(0.0),
    timeToComplete: optional(""),

    educationalLevel: optional({
        id: "",
        label: { "en": "" }
    }),

    about: multiple({
        id: "",
        label: { "en": "" }
    }),

    educationalCredentialAwarded: { "en": "" },
    occupationalCredentialAwarded: { "en": "" },

    hasCourse: multiple({
        id: "",
        label: { "en": "" }
    })

});


export function DataProgram() {

    const [route, setRoute]=useRoute();

    const entry=useEntry(route, Program);


    useEffect(() => setRoute({ label: entry({ value: ({ label }) => string(label) }) }));


    return <DataPage item={entry({ value: string })}

        menu={entry({ fetch: <NodeSpin/> })}

        pane={<DataPane

            header={<DataBack>{Programs}</DataBack>}

        >{entry({

            value: event => <DataProgramInfo>{event}</DataProgramInfo>

        })}</DataPane>}

    >{entry({

        fetch: <NodeHint>{CoursesIcon}</NodeHint>,

        value: course => <DataProgramBody>{course}</DataProgramBody>,

        error: error => <span>{error.status}</span> // !!! report

    })}</DataPage>;

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function DataProgramInfo({

    children: {

        label,
        university,
        provider,

        identifier,
        url,
        educationalLevel,
        numberOfCredits,
        timeToComplete,
        about,

        educationalCredentialAwarded,
        occupationalCredentialAwarded

    }

}: {

    children: typeof Program

}) {

    return <>

        <DataInfo>{{

            "University": <NodeLink>{university}</NodeLink>,
            "Provider": provider && <span>{string(provider)}</span>

        }}</DataInfo>

        <DataInfo>{{

            "Code": identifier && <span>{identifier}</span>,
            "Name": <span>{string(label)}</span>


        }}</DataInfo>

        <DataInfo>{{

            "Awards": (educationalCredentialAwarded || occupationalCredentialAwarded) && <>
                {educationalCredentialAwarded && <span>{string(educationalCredentialAwarded)}</span>}
                {occupationalCredentialAwarded && <span>{string(occupationalCredentialAwarded)}</span>}
            </>,

            "Level": educationalLevel && <span>{string(educationalLevel)}</span>,
            "Credits": numberOfCredits && <span>{numberOfCredits.toFixed(1)}</span>,
            "Duration": timeToComplete && <span>{timeToComplete}</span>  // !!! map to localized description

        }}</DataInfo>

        <DataInfo>{{

            "Subjects": about && about.map(subject => <span key={subject.id}>{string(subject)}</span>) // !!! link

        }}</DataInfo>

        <DataInfo>{{

            "Info": url && url.map(item => {

                const url=new URL(item);

                const host=url.host;
                const lang=url.pathname.match(/\b[a-z]{2}\b/i);

                return <a key={item} href={item}>{lang ? `${host} (${lang[0].toLowerCase()})` : host}</a>;

            })

        }}</DataInfo>

    </>;
}

function DataProgramBody({

    children: {

        comment,

        educationalCredentialAwarded,
        occupationalCredentialAwarded,

        hasCourse

    }

}: {

    children: typeof Program

}) {

    const description=string(comment);

    const details={
        "Educational Credential Awarded": string(educationalCredentialAwarded),
        "Occupational Credential Awarded": string(occupationalCredentialAwarded)
    };

    const detailed=Object.values(details).some(v => v);


    return <DataCard>

        {description && <ReactMarkdown remarkPlugins={[remarkGfm]}>{description}</ReactMarkdown>}

        {description && detailed && <hr/>}

        {detailed && <dl>{Object.entries(details)

            .filter(([, data]) => data)

            .map(([term, data]) => <Fragment key={term}>

                <dt>{term}</dt>
                <dd><ReactMarkdown remarkPlugins={[remarkGfm]}>{data}</ReactMarkdown></dd>

            </Fragment>)

        }</dl>}

        {hasCourse?.length && <>

            <h1>Courses</h1>

            <ul>{[...hasCourse]
                .sort((x, y) => string(x).localeCompare(string(y)))
                .map(course => <li key={course.id}><NodeLink>{course}</NodeLink></li>)
            }</ul>

        </>}

    </DataCard>;

}
