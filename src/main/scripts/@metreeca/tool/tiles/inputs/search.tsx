/*
 * Copyright © 2020-2021 Metreeca srl
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

import * as React from "react";
import { createElement, ReactNode, useEffect } from "react";
import { useProp } from "../../hooks/prop";
import { classes } from "../../index";
import { Search, X } from "../icon";
import "./search.css";

export function ToolSearch({

	icon=false,
	rule=false,

	menu,

	placeholder,

	auto=0,

	value,
	onChange=() => {}

}: {

	icon?: boolean | ReactNode
	rule?: boolean

	menu?: ReactNode

	placeholder?: string

	/**
	 * The delay in ms before changes are auto-submitted after the last edit; 0 to disable.
	 */
	auto?: number

	value: string
	onChange?: (value: string) => void

}) {

	let input: null | HTMLInputElement; // !!! review

	const [state, setState]=useProp(value);


	useEffect(() => {

		if ( auto ) {

			const timeout=setTimeout(() => onChange(state), auto);

			return () => clearTimeout(timeout);

		} else {

			return () => {};

		}

	}, [state]);


	function clear() {

		setState("");
		onChange("");

		input?.focus();

	}


	return createElement("tool-search", {}, <>

		{icon && <nav>{icon === true ? <Search/> : icon}</nav>}

		<input {...classes({ rule })} type="text" placeholder={placeholder}

			value={state} onChange={() => {}}

			ref={element => {

				if ( (input=element) ) {
					element.onfocus=(e) => (e.target as HTMLInputElement).select();
					element.oninput=(e) => setState((e.target as HTMLInputElement).value);
					element.onchange=(e) => onChange((e.target as HTMLInputElement).value);
				}

			}}

		/>

		{state && <nav>
			<button title="Clear" onClick={clear}><X/></button>
		</nav> || menu && <nav>{menu}</nav>}

	</>);
}