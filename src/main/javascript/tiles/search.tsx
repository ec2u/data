/*
 * Copyright © 2021 EC2U Consortium
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

import { h } from "preact";
import { Search, XCircle } from "preact-feather";
import { useEffect, useRef, useState } from "preact/hooks";
import { Custom } from "./custom";
import "./search.less";

export interface Props {

	placeholder?: string

}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export default function ToolSearch({

	placeholder=""

}: Props) {

	const [keywords, setKeywords]=useState("");

	const input=useRef<HTMLInputElement>();

	useEffect(() => input.current?.focus());

	return (
		<Custom tag="tool-search">

			<button disabled><Search/></button>

			<input autoFocus ref={input} type="text" placeholder={placeholder} value={keywords}
				onInput={e => setKeywords((e.currentTarget as HTMLInputElement).value)}
			/>

			{keywords
				? <button title="Clear" onClick={() => setKeywords("")}><XCircle/></button>
				: <span/>
			}

		</Custom>
	);
}
