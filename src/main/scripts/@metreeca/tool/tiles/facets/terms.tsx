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
import { createElement } from "react";
import { frame, string } from "../../bases";
import { Terms, TermsUpdater } from "../../hooks/queries/terms";
import "./terms.css";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function ToolTerms({

	value: [terms, setTerms]

}: {

	value: [Terms, TermsUpdater]

}) {

	return createElement("tool-terms", {}, terms.map(({

			selected, value, count

		}) => <div key={string(value)} className={count ? "available" : "unavailable"}>

			<input type="checkbox" checked={selected} disabled={!count}
				onChange={e => setTerms({ value, selected: e.currentTarget.checked })}
			/>

			{frame(value)
				? <a href={value.id}>{string(value)}</a>
				: <span>{string(value)}</span>
			}

			<var>{count}</var>

		</div>)
	);
}