/*
 * Copyright © 2025 Metreeca srl
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

import { Page, visit } from "@/utilities/core/fetch";
import { message } from "@/utilities/core/log";
import { FunctionDeclaration, Type } from "@google/genai";
import dedent from "dedent";


interface Tool<V=any, R=any> extends FunctionDeclaration {

	(args: V): R;

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function fetchPage(opts: Parameters<typeof visit>[1]={}): Tool<{ url: string }, Promise<Page | {
	error: string
}>> {

	const visited=new Set<string>();

	return Object.assign(
		async ({ url }: { url: string }) => {

			if ( visited.has(url) ) {
				return { error: "Already visited this URL" };
			}

			visited.add(url);

			try {
				return await visit(url, opts);
			} catch ( error ) {
				return { error: message(error) };
			}

		},
		{
			name: "fetchPage",
			description: dedent`Fetches and extracts the main content from a web page. 
					Returns the page title, a summary, the full text content in markdown format, and a list of outbound links with their URLs and anchor text. Use this function to explore pages that are likely to contain information about the research unit's identity, activities, topics, or child units.`,
			parameters: {
				type: Type.OBJECT,
				properties: {
					url: {
						type: Type.STRING,
						description: dedent`The absolute URL of the web page to fetch and extract content from (must start with http:// or https://)`
					}
				},
				required: ["url"]
			}
		}
	);

}
