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

import { Home } from "@ec2u/data/pages/home";
import { DataPage } from "@ec2u/data/tiles/page";
import { CancelIcon } from "@metreeca/skin/lucide";
import { useRoute } from "@metreeca/tool/nests/router";
import * as React from "react";
import { createElement } from "react";
import "./none.css";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export default function DataNone() {

    const [, setRoute]=useRoute();


    function doDismiss() {
        setRoute(Home.id, true);
    }


    return (

        <DataPage item="404 | Not Found"

            menu={<button title="Remove from History" onClick={() => doDismiss()}><CancelIcon/></button>}

        >

            {createElement("data-none", {})}

        </DataPage>

    );

}
