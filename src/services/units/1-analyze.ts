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

import { defaults } from "@/services/units/shared";
import { file } from "@/utilities/core/files";
import { DatastoreCache } from "@/utilities/gcp/cache";
import { ai, text } from "@/utilities/gcp/gemini";
import { fetchPage } from "@/utilities/gcp/gemini-tools";

export async function explore(site: string): Promise<string> {

	return ai().then(async ai => text(await ai.models.generateContent({
		model: "gemini-2.5-flash",
		contents: site,
		config: {
			...defaults,
			systemInstruction: await file("./1-analyze.md", import.meta.url),
			tools: [
				fetchPage({ cache: DatastoreCache({ kind: "Page" }) })
			],
			automaticFunctionCalling: {
				maximumRemoteCalls: 20
			}
		}
	})));

}
