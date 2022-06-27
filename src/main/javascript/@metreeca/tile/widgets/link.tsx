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

import { isEmpty } from "@metreeca/core";
import { Focus, isFocus, Literal, string } from "@metreeca/link";
import React from "react";


export function NodeLink({

    search,

    children

}: {

    search?: [Focus, { readonly [path: string]: undefined | Literal | Focus; }]

    children: Focus

}) {

    const label=string(children);

    if ( search ) {

        const query=Object.entries(search[1])
            .filter(([, value]) => value !== undefined && value !== "")
            .reduce((query, [key, value]) => Object.assign(query, { [key]: isFocus(value) ? value.id : value }), {});

        const href=isEmpty(query) ? search[0].id : `${search[0].id}?${encodeURI(JSON.stringify(query))}`;

        return <a href={href} title={label}>{label}</a>;

    } else {

        return <a href={children.id} title={label}>{label}</a>;

    }

}