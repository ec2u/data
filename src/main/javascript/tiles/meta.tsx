/*
 * Copyright © 2020-2022 Metreeca srl
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

import { useRoute } from "@metreeca/view/nests/router";
import { Info } from "@metreeca/view/tiles/icon";
import React, { createElement } from "react";
import "./meta.css";


// !!! to be reviewed after metreeca/java supports resource access to collections

export function metadata(dataset: string) {
    return dataset.replace(/^(\/\w+)?\/?/, "/datasets$1");
}


/**
 * Dataset metadata button.
 *
 * @param children
 * @constructor
 */
export function DataMeta({

    children

}: {

    children: string

}) {

    const [, setRoute]=useRoute();


    function doOpen() {
        setRoute(metadata(children));
    }

    return createElement("data-meta", {},
        <button title={"View dataset metadata"} onClick={doOpen}><Info/></button>
    );

}