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

import { Courses, CoursesIcon } from "@ec2u/data/pages/courses/courses";
import { DataBack } from "@ec2u/data/tiles/back";
import { DataCard } from "@ec2u/data/tiles/card";
import { DataInfo } from "@ec2u/data/tiles/info";
import { DataPage } from "@ec2u/data/tiles/page";
import { DataPane } from "@ec2u/data/tiles/pane";
import { immutable } from "@metreeca/core";
import { multiple, optional, string } from "@metreeca/link";
import { NodeHint } from "@metreeca/tile/widgets/hint";
import { NodeLink } from "@metreeca/tile/widgets/link";
import { NodeSpin } from "@metreeca/tile/widgets/spin";
import { useEntry } from "@metreeca/tool/nests/graph";
import { useRoute } from "@metreeca/tool/nests/router";
import * as React from "react";
import { Fragment, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";


const Languages: { [language: string]: { [language: string]: string } }={ // !!! complete translations
    "en": {
        "en": "English",
        "it": "Inglese"
    },
    "pt": {
        "en": "Portuguese",
        "it": "Portoghese"
    },
    "ro": {
        "en": "Romanian",
        "it": "Rumeno"
    },
    "de": {
        "en": "German",
        "it": "Tedesco"
    },
    "it": {
        "en": "Italian",
        "it": "Italiano"
    },
    "fr": {
        "en": "French",
        "it": "Francese"
    },
    "es": {
        "en": "Spanish",
        "it": "Spagnolo"
    },
    "fi": {
        "en": "Finnish",
        "it": "Finlandese"
    }
};


export const Course=immutable({

    id: "/courses/{code}",

    image: "",
    label: { "en": "Course" },
    comment: { "en": "" },

    university: {
        id: "",
        label: { "en": "" }
    },

    url: multiple(""),

    courseCode: optional(""),
    inLanguage: optional(""),
    numberOfCredits: optional(0),
    timeRequired: optional(""),

    educationalLevel: optional({
        id: "",
        label: { "en": "" }
    }),

    about: multiple({
        id: "",
        label: { "en": "" }
    }),

    teaches: { "en": "" },
    assesses: { "en": "" },
    coursePrerequisites: { "en": "" },
    learningResourceType: { "en": "" },
    competencyRequired: { "en": "" },
    educationalCredentialAwarded: { "en": "" },
    occupationalCredentialAwarded: { "en": "" }

});


export function DataCourse() {

    const [route, setRoute]=useRoute();

    const entry=useEntry(route, Course);


    useEffect(() => setRoute({ label: entry({ value: ({ label }) => string(label) }) }));


    return <DataPage item={entry({ value: string })}

        menu={entry({ fetch: <NodeSpin/> })}

        pane={<DataPane

            header={<DataBack>{Courses}</DataBack>}

        >{entry({

            value: event => <DataCourseInfo>{event}</DataCourseInfo>

        })}</DataPane>}

    >{entry({

        fetch: <NodeHint>{CoursesIcon}</NodeHint>,

        value: course => <DataCourseBody>{course}</DataCourseBody>,

        error: error => <span>{error.status}</span> // !!! report

    })}</DataPage>;

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function DataCourseInfo({

    children: {

        label,
        university,

        url,
        courseCode,
        educationalLevel,
        inLanguage,
        numberOfCredits,
        timeRequired,
        about

    }

}: {

    children: typeof Course

}) {

    return <>

        <DataInfo>{{

            "University": <NodeLink>{university}</NodeLink>

        }}</DataInfo>

        <DataInfo>{{

            "Code": courseCode && <span>{courseCode}</span>,
            "Name": <span>{string(label)}</span>


        }}</DataInfo>

        <DataInfo>{{

            "Level": educationalLevel && <span>{string(educationalLevel)}</span>,
            "Language": inLanguage && <span>{string(Languages[inLanguage]) || inLanguage}</span>,
            "Credits": numberOfCredits && <span>{numberOfCredits}</span>,
            "Duration": timeRequired && <span>{timeRequired}</span>,  // !!! map to localized description
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

function DataCourseBody({

    children: {

        comment,

        teaches,
        assesses,
        coursePrerequisites,
        learningResourceType,
        competencyRequired,
        educationalCredentialAwarded,
        occupationalCredentialAwarded

    }

}: {

    children: typeof Course

}) {

    const description=string(comment);

    const details={
        "General Objectives": string(teaches),
        "Learning Objectives and Intended Skills": string(assesses),
        "Admission Requirements": string(coursePrerequisites),
        "Teaching Methods and Mode of Study": string(learningResourceType),
        "Graduation Requirements": string(competencyRequired),
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

    </DataCard>;

}