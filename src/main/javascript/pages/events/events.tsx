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
import { Query } from "@metreeca/link";
import { NodePane } from "@metreeca/tile/pane";
import { Updater } from "@metreeca/tool/hooks";
import { useParameters } from "@metreeca/tool/hooks/parameters";
import { useRoute } from "@metreeca/tool/nests/router";
import * as React from "react";
import { useEffect } from "react";


export const Events=immutable({

    id: "/events/",

    label: "Events",

    contains: [{

        id: "",

        image: "",
        label: "",
        comment: "",

        university: {
            id: "",
            label: ""
        },

        startDate: "",
        endDate: ""

    }]

});


export function DataEvents() {

    const [route, setRoute]=useRoute();

    const [query, setQuery]=useParameters<Query>({

        "~label": "",

        ".order": "startDate",
        ".limit": 20

    });

    // const [{ fetch, frame, error }]=useEntry("", Events, [query, setQuery]);


    useEffect(() => { setRoute({ label: Events.label }); }, []);


    return <></> /*<DataPage item={string(Events.label)}

     menu={fetch(abort => <ToolSpin abort={abort}/>)}

     side={<DataFiltersButton onClick={update}/>}

     pane={facets([query, setQuery])}

     >

     {frame(({ contains }) => contains.map(({ id, label, image, comment, university, startDate }) => (

     <DataCard key={id}

     name={<a href={id}>{string(label)}</a>}

     icon={image?.[0]}

     tags={<>
     <span>{string(university.label).replace("University of ", "")}</span>
     {startDate && <>
     <span> / </span>
     <span>{startDate.substr(0, 10)}</span>
     </>}
     </>}

     >

     {string(comment, ["en", "pt", "ro", "it", "fr", "es", "fi"])}

     </DataCard>

     )))}

     {error(error => <span>{error.status}</span>)} {/!* !!! *!/}

     </DataPage>*/;

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function facets([query, setQuery]: [query: Query, setQuery: Updater<Query>]) {

    // const [search, setSearch]=useSearch("label", [query, setQuery]);
    //
    // const [universities, setUniversities]=useTerms("", "university", [query, setQuery]);
    // const [publishers, setPublishers]=useTerms("", "publisher", [query, setQuery]);
    // const [date, setDate]=useStats("", "startDate", [query, setQuery]);
    //
    // const [{ count }]=useStats("", "", [query, setQuery]);

    return <NodePane

        // header={<ToolSearch icon rule placeholder={"Search"}
        //     auto value={search} onChange={setSearch}
        // />}

        // footer={count === 0 ? "no matches" : count === 1 ? "1 match" : `${count} matches`}

    >

        {/* <ToolFacet expanded name={string(University.label)}
         menu={<button title={"Clear filter"} onClick={() => {}}><ClearIcon/></button>}
         >
         <ToolTerms value={[universities, setUniversities]}/>
         </ToolFacet>*/}

        {/* <ToolFacet expanded name={"Publisher"}
         menu={<button title={"Clear filter"} onClick={() => {}}><ClearIcon/></button>}
         >
         <ToolTerms value={[publishers, setPublishers]}/>
         </ToolFacet>*/}

        {/* <ToolFacet expanded name={"Date"}
         menu={<button title={"Clear filter"} onClick={() => {}}><ClearIcon/></button>}
         >
         <ToolRange pattern={"\\d{4}-\\d{2}-\\d{2}"} value={[date, setDate]}/>
         </ToolFacet>*/}

    </NodePane>;
}