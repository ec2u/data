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
import "./pill.css";


/**
 * Creates a pill.
 *
 * Sets a short label in a rounded outline, so a value classifying an item reads as a tag rather than as running text.
 * The pill is kept to one line, clipped with an ellipsis where it outruns the room it is given.
 */
export function Pill({

	look,

	children

}: {

	/**
	 * How loud the pill appears; reserved for emphasis variants, all rendered as an outline with no fill for now.
	 */
	look?: "subtle" | "normal" | "strong"


	/**
	 * The label set inside the pill.
	 */
	children?: ComponentChildren

}) {

	return createElement("ec2u-pill", { look }, children);

}
