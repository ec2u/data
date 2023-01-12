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

import { Loader2 } from "@metreeca/tile/widgets/icon";
import * as React from "react";
import { createElement, ReactNode } from "react";

import "./spin.css";


export function NodeSpin({

    icon=<Loader2/>,
    title,

    size,
    thickness,
    color,
    period,

    onClick

}: {

    icon?: ReactNode
    title?: string

    size?: string
    thickness?: string
    color?: string
    period?: string,

    onClick?: () => void

}) {

    return createElement("node-spin", {

        style: {

            "--node-spin-size": size,
            "--node-spin-thickness": thickness,
            "--node-spin-color": color,
            "--node-spin-period": period

        }

    }, <button type={"button"} title={title || onClick ? "Cancel" : undefined}

        onClick={onClick || (() => {})}

    >{

        icon

    }</button>);

}
