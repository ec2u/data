/*
 * Copyright © 2020-2023 Metreeca srl
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

import { createElement, ReactNode } from "react";
import "./panel.css";


export function NodelPanel({

    name,

    stack=false,
    cover=false,

    large=false,
    small=false,

    children

}: {

    name?: ReactNode

    stack?: boolean
    cover?: boolean

    large?: boolean
    small?: boolean

    children?: ReactNode

}) {

    return createElement("node-panel", {

        stack: stack ? "" : undefined,
        cover: cover ? "" : undefined,

        large: large ? "" : undefined,
        small: small ? "" : undefined,

        "data-name": name

    }, children);

}