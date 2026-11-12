/*
 * Copyright © 2020-2026 EC2U Alliance
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

import { type ComponentChildren, createElement } from "preact";
import "./funded.css";
import { Funding } from "./funding.js";


/**
 * Creates a page body closing with the EU funding acknowledgement.
 *
 * Fills the body of the page and closes it with the acknowledgement the grant agreement requires, resting at the
 * bottom of a body too short to fill the page and following the content otherwise.
 *
 * @param children The content of the page body
 *
 * @returns The funded page body
 */
export function Funded({

	children

}: {

	children?: ComponentChildren

}) {

	return createElement("ec2u-funded", {}, <div>{children}</div>, <Funding/>);

}
