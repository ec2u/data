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

import { Button } from "@metreeca/tile-cell/button";
import { Icon } from "@metreeca/tile-cell/icon";
import { type ComponentChildren, createElement } from "preact";
import "./options.css";


/**
 * Creates a facet filter.
 *
 * Lists the values a facet takes over a collection, each beside a checkbox selecting it and the number of items
 * carrying it, so the reader narrows the collection to the items carrying any of the selected values. Values that no
 * item carries under the other filters in force are shown dimmed, but stay available for deselection.
 */
export function Options({

	name,
	options,

	onSelect,
	onReset

}: {

	/**
	 * The name of the facet, heading the list.
	 */
	name: string

	/**
	 * The values the facet takes, in display order; `undefined` while they are still being retrieved.
	 */
	options?: readonly {
		readonly value: string
		readonly label: ComponentChildren
		readonly count: number
		readonly selected: boolean
	}[]

	/**
	 * What a change of selection is handed to.
	 *
	 * @param value The value selected or deselected
	 * @param selected Whether `value` is now selected
	 */
	onSelect: (value: string, selected: boolean) => void

	/**
	 * What a request to deselect every value is handed to.
	 */
	onReset: () => void

}) {

	const selected = options?.some(({ selected }) => selected) ?? false;


	return createElement("ec2u-options", {}, <>

		<header>

			<Icon.ListFilter/>
			<span>{name}</span>

			{selected && <Button look={"subtle"} icon={<Icon.Clear/>} title={"Reset"} onClick={onReset}/>}

		</header>

		{options && (options.length > 0
			? <ul>{options.map(({ value, label, count, selected }) =>

				<li key={value} class={count > 0 ? undefined : "ec2u-options-unavailable"}>

					<input type={"checkbox"} checked={selected} aria-label={value}
						onChange={event => onSelect(value, event.currentTarget.checked)}
					/>

					<span>{label}</span>
					<small>{count.toLocaleString()}</small>

				</li>
			)}</ul>
			: <small>No Matches</small>
		)}

	</>);

}
