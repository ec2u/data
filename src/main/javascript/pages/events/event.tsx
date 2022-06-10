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


export const Event=immutable({

    id: "/events/{code}",

    image: "",
    label: "Event",
    comment: "",

    description: "",

    startDate: ""

});


export function DataEvent() {

    // const { name }=useRouter();
    //
    // const [{ fetch, frame, error }]=useEntry("", Event);
    //
    //
    // useEffect(() => { frame(({ label }) => name(string(label))); });


    return <></>  /*<DataPage

     item={<>
     <a href={"/events/"}>Events</a>
     <span>{frame(({ label }) => string(label))}</span>
     </>}

     menu={fetch(abort => <ToolSpin abort={abort}/>)}

     >

     {frame(({

     image,
     label,
     comment,

     description,

     startDate

     }) => (

     <DataCard

     icon={image && <img src={image} alt={`Image of ${string(label)}`}/>}

     info={<dl>

     <dt>Start Date</dt>
     <dd>{startDate}</dd>

     </dl>}

     >

     <p>{string(description)}</p>

     </DataCard>

     ))}

     {error(error => <span>{error.status}</span>)} {/!* !!! *!/}

     </DataPage>*/;

}
