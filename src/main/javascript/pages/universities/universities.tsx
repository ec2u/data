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
import { useRoute } from "@metreeca/tool/nests/router";
import * as React from "react";
import { useEffect } from "react";
import { DataPage } from "../../tiles/page";


export const Universities=immutable({

    id: "/universities/",

    label: "Universities",

    contains: [{

        id: "",

        image: "",
        label: "",
        comment: "",

        country: {
            id: "",
            label: ""
        }

    }]

});


export function DataUniversities() {

    const [, setRoute]=useRoute();


    useEffect(() => { setRoute({ label: Universities.label }); }, []);


    return <DataPage item={Universities.label}

        // menu={<ToolSpin/>}

    >

        {/*{frame(({ contains }) => contains.map(({ id, label, image, comment, country }) => (*/}

        {/*    <DataCard key={id}*/}

        {/*        name={<a href={id}>{string(label)}</a>}*/}
        {/*        icon={image}*/}
        {/*        tags={<span>{string(country)}</span>}*/}

        {/*    >*/}
        {/*        {string(comment)}*/}

        {/*    </DataCard>*/}

        {/*)))}*/}

        {/*{error(error => <span>{error.status}</span>)}  !!! */}

    </DataPage>;

}
