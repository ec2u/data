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

import DataHome, { Home } from "@ec2u/data/pages/home";
import DataNone from "@ec2u/data/pages/none";
import "@metreeca/skin/index.css";
import "@metreeca/skin/quicksand.css";
import { NodeFetcher } from "@metreeca/tool/nests/fetcher";
import { NodeRouter } from "@metreeca/tool/nests/router";
import * as React from "react";
import { render } from "react-dom";
import "./index.css";


render((

    <React.StrictMode>

        <NodeFetcher>

            <NodeRouter routes={{

                [Home.id]: DataHome,
                // [About.id]: DataAbout,

                // [Universities.id]: DataUniversities,
                // [University.id]: DataUniversity,

                // [Events.id]: DataEvents,
                // [Event.id]: DataEvent,

                "*": DataNone

            }}/>

        </NodeFetcher>

    </React.StrictMode>

), document.body.firstElementChild);
