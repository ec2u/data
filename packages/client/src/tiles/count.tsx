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

import { createElement } from "preact";
import "./count.css";


/**
 * Creates a collection size label.
 *
 * States how many items a collection holds, counting them as matches while a filter narrows it, so the reader tells a
 * filtered view from the whole collection; nothing is shown while the size is still unknown.
 */
export function Count({

	filtered = false,
	children

}: {

	/**
	 * Whether a filter narrows the collection; unfiltered if omitted.
	 */
	filtered?: boolean

	/**
	 * The number of items, `undefined` while still unknown.
	 */
	children?: number

}) {

	const noun = filtered
		? children === 1 ? "match" : "matches"
		: children === 1 ? "item" : "items";

	return createElement("ec2u-count", {}, children === undefined ? undefined
		: children === 0 ? `no ${noun}`
			: `${children.toLocaleString()} ${noun}`
	);

}
