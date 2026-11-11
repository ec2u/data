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
import "./print.css";


/**
 * Creates a block of fine print.
 *
 * Sets its content in the reduced type shared by the notices and the funding acknowledgement at the foot of a page,
 * leaving the small print of skin-managed content elsewhere at its design system size.
 *
 * @param children The content to set in fine print
 *
 * @returns The fine print block
 */
export function Print({

	children

}: {

	children?: ComponentChildren

}) {

	return createElement("ec2u-print", {}, children);

}
