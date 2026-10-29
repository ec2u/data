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
import { createElement } from "preact";
import { useEffect, useState } from "preact/hooks";
import "./search.css";


/**
 * Creates a keyword search field.
 *
 * Hands the trimmed keywords over once the reader pauses typing, so a search runs once per query rather than once per
 * keystroke; the clear control empties the field and hands over the empty query at once.
 */
export function Search({

	placeholder,
	delay = 500,

	value,
	onChange

}: {

	/**
	 * The hint shown while the field is empty, naming what the keywords are matched against.
	 */
	placeholder?: string

	/**
	 * The pause in milliseconds after the last keystroke before the keywords are handed over.
	 */
	delay?: number

	/**
	 * The keywords currently searched for.
	 */
	value: string

	/**
	 * What the keywords are handed to once the reader pauses typing or clears the field.
	 *
	 * @param value The trimmed keywords, empty to search for nothing
	 */
	onChange: (value: string) => void

}) {

	const [input, setInput] = useState(value);

	useEffect(() => setInput(value), [value]); // a query reset from outside empties the field

	useEffect(() => {

		const keywords = input.trim();
		const timer = keywords === value ? undefined : setTimeout(() => onChange(keywords), delay);

		return () => clearTimeout(timer);

	}, [input, value, delay, onChange]);


	function clear() {
		setInput("");
		onChange("");
	}


	return createElement("ec2u-search", {}, <>

		<Icon.Search/>

		<input type={"search"} value={input} placeholder={placeholder}

			onFocus={event => event.currentTarget.select()}
			onInput={event => setInput(event.currentTarget.value)}

		/>

		{input && <Button look={"subtle"} icon={<Icon.Clear/>} title={"Clear"} onClick={clear}/>}

	</>);

}
