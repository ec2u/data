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


import { explore } from "@/services/units/1-explore";
import { defaults } from "@/services/units/shared";
import { Page } from "@/utilities/core/fetch";
import { dump } from "@/utilities/core/log";
import { pipe } from "@/utilities/core/pipe";
import { md } from "@/utilities/core/tag";
import { DatastoreCache } from "@/utilities/gcp/cache";
import { ai, text } from "@/utilities/gcp/gemini";
import { estimateResponseCost, formatCostBreakdown } from "@/utilities/gcp/gemini-cost";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

pipe(
	// "https://iii.dip.unipv.it/"
	"https://dbbs.dip.unipv.it/"
	// "https://dbbs.dip.unipv.it/it/ricerca/linee-e-gruppi-di-ricerca/linee-e-temi-di-ricerca/unita-di-psicologia-dello-sviluppo-e"
	// "http://lag.unipv.it/en/" "http://psicologia.unipv.it/laboratori/lasc/163-lasc.html"

	// "https://giurisprudenza.dip.unipv.it/"
	// "https://dirittoesanita.unipv.it/"

	// "https://microwave.unipv.it"
	// "https://dbb.dip.unipv.it/it/ricerca/tematiche-di-ricerca-e-laboratori/biologia-vegetale"
	// "https://dbb.dip.unipv.it/it/ricerca/tematiche-di-ricerca-e-laboratori/biologia-vegetale/laboratorio-di-biotecnologie-vegetali"

	// "https://www.jku.at/institut-fuer-elektrische-antriebe-und-leistungselektronik/"

	, {

		label: "units-url",
		cache: DatastoreCache({ kind: "Memo" })

	}
)

	.then(explore)

	.then(function analyze(pages: readonly Page[]): Promise<string> {
			return ai().then(async ai => {
				const response=await ai.models.generateContent({

					model: "gemini-2.5-flash",

					config: {

						...defaults,

						tools: [{ urlContext: {} }],

						systemInstruction: md`
				
					ROLE / You are an academic content manager specializing in research activities.
					
					INPUT / You will be provided with an annotated sitemap for a website describing an academic
					research unit, formatted as a markdown list, with the first item describing the homepage of
					the website. Each item includes:
					
					- the page URL and page title as a markdown link
					- a brief excerpt of the page content
					
					GOAL / Your task is to identify pages linking child research units
					
					OUTPUT / Reply with a plaintext list of URLs, one for each line
				
					URL ACCESS
					
					- ALWAYS retrieve relevant content from URLs where it is likely to be found, prioritizing
					them against the goals of the analysis, taking into also their title and summary
					- Make ABSOLUTELY sure to access pages likely containing directories of child units
					- Make ABSOLUTELY sure to prioritize access to local language pages over their English translation
					

			`
					},

					contents: pages
						.map(page => `- [${page.title}](${page.url})\n  ${page.summary}`)
						.join("\n\n")

				});

				console.log(JSON.stringify(response.candidates?.[0].urlContextMetadata, null, 4));

				const costBreakdown=estimateResponseCost(response);

				if ( costBreakdown ) {
					console.log(formatCostBreakdown(costBreakdown));
				}

				return text(response);

			});
		}
	)


	.then(dump("work.md"))

	.catch(console.error);
