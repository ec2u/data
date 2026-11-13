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

import { Button } from "@metreeca/clay-widgets/button";
import { Empty } from "@metreeca/clay-widgets/empty";
import { Icon } from "@metreeca/clay-widgets/icon";
import { useRouter } from "@metreeca/clay/router";
import { immutable } from "@metreeca/core/values";
import { NotFound } from "@metreeca/http";
import { Failure } from "../widgets/failure.js";
import { Page } from "../widgets/page.js";
import { datasets } from "./index.js";


export const unknown = immutable({

	route: "*",
	label: "404 | Not Found",
	glyph: <Icon.NotFound/>,

	problem: {
		status: NotFound,
		title: "Not Found",
		detail: "The requested page doesn't exist"
	}

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function Unknown() {

	const router = useRouter();


	function dismiss() {
		return router({ route: datasets.route, replace: true });
	}


	return <Page

		head={unknown.label}
		menu={<Button icon={<Icon.Close/>} title={"Dismiss"} onClick={dismiss}/>}

	>

		<Failure problem={unknown.problem}>
			<Empty look={"subtle"}>
				{unknown.glyph}
				<span style={{ maxInlineSize: "24em", textWrap: "balance" }}>
					The content you are looking for doesn't exist or has been moved
				</span>
			</Empty>
		</Failure>

	</Page>;

}
