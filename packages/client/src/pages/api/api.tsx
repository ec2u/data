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

import { lexicon } from "@ec2u/data-shared/vocabularies/index.js";
import { APIDatatypes, APIEndpoints, APIPrefixes, APIShapes } from "@kxta/tile-api";
import { Path } from "@metreeca/clay-widgets/path";
import { Stack } from "@metreeca/clay-widgets/stack";
import { TOC } from "@metreeca/clay-widgets/toc";
import { useRouter } from "@metreeca/clay/router";
import { useEffect } from "preact/hooks";
import { Page } from "../../widgets/page.js";
import { endpoints } from "./_.js";
import { api } from "./index.js";


/**
 * Creates the index of the data model served by the hub.
 *
 * Sets out the routes the hub serves and its data model, each shape linked to its own page.
 *
 * @returns The models page
 */
export function APIPage() {

	const router = useRouter();


	useEffect(() => router({ title: api.label }), []);


	return <Page head={<Path>

		{api.label}

	</Path>} tray={<Stack space={"spacing075"}>

		<p style={{

			whiteSpace: "pre-line"

		}}>

			Reference documentation for{"\n"}
			the REST/JSON-LD API exposed{"\n"}
			by the hub and its data model.

		</p>

		<TOC name={"Contents"} entries={[
			{ label: "API Endpoints", href: "#api-endpoints" },
			{
				label: "Data Model", href: "#data-model", entries: [
					{ label: "Shapes", href: "#shapes" },
					{ label: "Datatypes", href: "#datatypes" },
					{ label: "Prefixes", href: "#prefixes" }
				]
			}
		]}/>

	</Stack>}>

		<Stack space={"spacing200"}>

			<Stack space={"spacing100"}>
				<h2 id={"api-endpoints"}>API Endpoints</h2>
				<p>Paths of the API resources, with their shapes.</p>
				<APIEndpoints endpoints={endpoints} lexicon={lexicon}/>
			</Stack>

			<Stack space={"spacing100"}>

				<h2 id={"data-model"}>Data Model</h2>

				<Stack space={"spacing200"}>

					<Stack space={"spacing075"}>
						<h3 id={"shapes"}>Shapes</h3>
						<p>Structures of the API resources, by inheritance.</p>
						<APIShapes endpoints={endpoints} lexicon={lexicon}/>
					</Stack>

					<Stack space={"spacing075"}>
						<h3 id={"datatypes"}>Datatypes</h3>
						<p>Types of plain values, by kind.</p>
						<APIDatatypes lexicon={lexicon}/>
					</Stack>

					<Stack space={"spacing075"}>
						<h3 id={"prefixes"}>Prefixes</h3>
						<p>Abbreviations of IRIs, with their namespaces.</p>
						<APIPrefixes lexicon={lexicon}/>
					</Stack>

				</Stack>

			</Stack>

		</Stack>

	</Page>;

}
