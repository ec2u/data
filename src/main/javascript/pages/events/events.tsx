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

import { University } from "@ec2u/data/pages/universities/university";
import { DataCard } from "@ec2u/data/tiles/card";
import { DataMeta } from "@ec2u/data/tiles/meta";
import { DataPage } from "@ec2u/data/tiles/page";
import { DataPane } from "@ec2u/data/tiles/pane";
import { immutable } from "@metreeca/core";
import { multiple, optional, string } from "@metreeca/core/value";
import { useQuery } from "@metreeca/view/hooks/query";
import { useRoute } from "@metreeca/view/nests/router";
import { Calendar } from "@metreeca/view/tiles/icon";
import { NodeCount } from "@metreeca/view/tiles/lenses/count";
import { NodeItems } from "@metreeca/view/tiles/lenses/items";
import { NodeKeywords } from "@metreeca/view/tiles/lenses/keywords";
import { NodeOptions } from "@metreeca/view/tiles/lenses/options";
import { NodeRange } from "@metreeca/view/tiles/lenses/range";
import * as React from "react";
import { useEffect } from "react";


export const EventsIcon=<Calendar/>;

export const Events=immutable({

    id: "/events/",
    label: { "en": "Events" },

    contains: multiple({

        id: "",
        image: optional(""),
        label: {},
        comment: {},

        university: {
            id: "",
            label: {}
        },

        startDate: optional(""),
        endDate: optional("")

    })

});


export function DataEvents() {

    const [route, setRoute]=useRoute();
    const [query, setQuery]=useQuery({ ".order": ["startDate", "label"] }, sessionStorage);


    useEffect(() => { setRoute({ label: string(Events) }); }, []);


    return <DataPage item={string(Events)}

        menu={<DataMeta>{route}</DataMeta>}

        pane={<DataPane

            header={<NodeKeywords state={[query, setQuery]}/>}
            footer={<NodeCount state={[query, setQuery]}/>}

        >

            <NodeOptions path={"university"} type={"anyURI"} placeholder={"University"} state={[query, setQuery]}/>
            <NodeOptions path={"publisher"} type={"anyURI"} placeholder={"Publisher"} state={[query, setQuery]}/>

            <NodeOptions path={"subject"} type={"string"} placeholder={"Topic"} state={[query, setQuery]}/>
            <NodeRange path={"startDate"} type={"dateTime"} as={"date"} placeholder={"Start Date"} state={[query, setQuery]}/>

            <NodeOptions path={"isAccessibleForFree"} type={"boolean"} placeholder={"Free Entry"} state={[query, setQuery]}/>
            <NodeOptions path={"location"} type={"anyURI"} placeholder={"Location"} state={[query, setQuery]}/>
            <NodeOptions path={"organizer"} type={"anyURI"} placeholder={"Organizer"} state={[query, setQuery]}/>

        </DataPane>}

        deps={[JSON.stringify(query)]}

    >

        <NodeItems model={Events} placeholder={EventsIcon} state={[query, setQuery]}>{({

            id,

            image,
            label,
            comment,

            university,
            startDate

        }) =>

            <DataCard key={id} compact

                name={<a href={id}>{string(label)}</a>}

                icon={image?.[0]}

                tags={<>
                    <span>{string(university)}</span>
                    {startDate && <><span> / </span><span>{startDate.substring(0, 10)}</span></>}
                </>}

            >

                {string(comment)}

            </DataCard>

        }</NodeItems>

    </DataPage>;

}

