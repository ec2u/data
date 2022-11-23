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


export const Actors=immutable({

    id: "/actors/",
    label: "Knowledge Ecosystem Actors"

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function DataActors() {

    const [, setRoute]=useRoute();

    useEffect(() => { window.open("https://tinyurl.com/24f693ej", "_blank");}, []);
    useEffect(() => { setRoute({ route: "/" }); }, []);

    return null;

}