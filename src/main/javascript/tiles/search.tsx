/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
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
