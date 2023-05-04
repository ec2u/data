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

import { DataMeta } from "@ec2u/data/pages/datasets/dataset";
import { University } from "@ec2u/data/pages/universities/university";
import { DataCard } from "@ec2u/data/views/_card";
import { DataPage } from "@ec2u/data/views/page";
import { DataPane } from "@ec2u/data/views/pane";
import { immutable } from "@metreeca/core";
import { multiple, string } from "@metreeca/core/value";
import { useQuery } from "@metreeca/view/hooks/query";
import { useRoute } from "@metreeca/view/nests/router";
import { BookOpen } from "@metreeca/view/tiles/icon";
import { NodeCount } from "@metreeca/view/tiles/lenses/count";
import { NodeItems } from "@metreeca/view/tiles/lenses/items";
import { NodeKeywords } from "@metreeca/view/tiles/lenses/keywords";
import { NodeOptions } from "@metreeca/view/tiles/lenses/options";
import { NodeRange } from "@metreeca/view/tiles/lenses/range";
import * as React from "react";
import { useEffect } from "react";


export const CoursesIcon=<BookOpen/>;

export const Courses=immutable({

    id: "/courses/",
    label: { "en": "Courses" },

	members: multiple({

		id: "",
		label: {},
		comment: {},

		university: {
			id: "",
			label: {}
		}

    })

});


export function DataCourses() {

    const [route, setRoute]=useRoute();
    const [query, setQuery]=useQuery({ ".order": ["label"] }, sessionStorage);


    useEffect(() => { setRoute({ title: string(Courses) }); }, []);


    return <DataPage item={string(Courses)}

        menu={<DataMeta>{route}</DataMeta>}

        pane={<DataPane

            header={<NodeKeywords state={[query, setQuery]}/>}
            footer={<NodeCount state={[query, setQuery]}/>}

        >

            <NodeOptions path={"university"} type={"anyURI"} placeholder={"University"} state={[query, setQuery]}/>
            <NodeOptions path={"provider"} type={"anyURI"} placeholder={"Provider"} state={[query, setQuery]}/>
            <NodeOptions path={"educationalLevel"} type={"anyURI"} placeholder={"Level"} state={[query, setQuery]}/>
            <NodeOptions path={"inLanguage"} type={"string"} placeholder={"Language"} state={[query, setQuery]}/> {/* !!! labels */}
            <NodeOptions path={"timeRequired"} type={"string"} placeholder={"Time Required"} state={[query, setQuery]}/>
            <NodeRange path={"numberOfCredits"} type={"decimal"} placeholder={"Credits"} state={[query, setQuery]}/>
            {/*<NodeOptions path={"educationalCredentialAwarded"} type={"anyURI"} placeholder={"Title Awarded"} state={[query, setQuery]}/>*/}

        </DataPane>}

        deps={[JSON.stringify(query)]}

    >

        <NodeItems model={Courses} placeholder={CoursesIcon} state={[query, setQuery]}>{({

            id,

            label,
            comment,

            university

        }) =>

            <DataCard key={id} compact

                name={<a href={id}>{string(label)}</a>}

                tags={string(university)}

            >

                {string(comment)}

            </DataCard>

        }</NodeItems>

    </DataPage>;

}

