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

import { immutable } from "@metreeca/core";
import * as React from "react";
import { DataPage } from "../../tiles/page";


function optional<T>(value: T): undefined | typeof value {
    return value;
}

export const University=immutable({

    id: "/universities/{code}",

    image: "",
    label: "University",
    comment: "",

    schac: "",
    lat: 0,
    long: 0,

    inception: optional(""),
    students: optional(0),

    country: optional({
        id: "",
        label: ""
    }),

    location: optional({
        id: "",
        label: ""
    })

});


export function DataUniversity() {

    // const { name }=useRouter();

    // const [{ fetch, frame, error }]=useEntry("", University);


    // useEffect(() => { frame(({ label }) => name(string(label))); });


    return <DataPage

        // item={<>
        // 	<a href={Universities.id}>{string(Universities.label)}</a>
        // 	{frame(({ label }) => <span>{string(label)}</span>)}
        // </>}

        // menu={fetch(abort => <ToolSpin abort={abort}/>)}

    >

        {/*{frame(({*/}

        {/*		image, label, comment,*/}
        {/*		inception, students,*/}
        {/*		country, location*/}

        {/*	}) => (*/}

        {/*		<DataCard*/}

        {/*			icon={image && <img src={image} alt={`Image of ${string(label)}`}/>}*/}

        {/*			info={<dl>*/}

        {/*				<dt>Inception</dt>*/}
        {/*				<dd>{inception && inception.substr(0, 4) || "-"}</dd>*/}

        {/*				<dt>Country</dt>*/}
        {/*				<dd>{country && <a href={country.id}>{string(country.label)}</a>}</dd>*/}

        {/*				<dt>City</dt>*/}
        {/*				<dd>{location && <a href={location.id}>{string(location.label)}</a>}</dd>*/}

        {/*				{students && <>*/}
        {/*					<dt>Students</dt>*/}
        {/*					<dd>{string(students)}</dd>*/}
        {/*				</>}*/}

        {/*			</dl>}*/}

        {/*		>*/}

        {/*			<p>{string(comment)}</p>*/}

        {/*		</DataCard>*/}

        {/*	)*/}
        {/*)}*/}

        {/*{error(error => <span>{error.status}</span>)} /!* !!! *!/*/}

    </DataPage>;
}