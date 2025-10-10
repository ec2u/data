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

import { analyze, structure } from "@/pipelines/leads";
import { dump } from "@/utilities/node/files";

Promise.resolve(
		// "https://iii.dip.unipv.it/"
		// "https://microwave.unipv.it"

		// "https://dbbs.dip.unipv.it/"
		// "https://dbbs.dip.unipv.it/it/ricerca/linee-e-gruppi-di-ricerca/linee-e-temi-di-ricerca/unita-di-statistica-medica-e-genomica"
		// "https://dbbs.dip.unipv.it/it/ricerca/linee-e-gruppi-di-ricerca/linee-e-temi-di-ricerca/unita-di-psicologia-applicata"
		// "https://dbbs.dip.unipv.it/it/ricerca/linee-e-gruppi-di-ricerca/linee-e-temi-di-ricerca/unita-di-psicologia-sperimentale-e"
		// "http://lag.unipv.it/en/"
		// "http://psicologia.unipv.it/laboratori/lasc/163-lasc.html"

		// "https://giurisprudenza.dip.unipv.it/"
		// "https://dirittoesanita.unipv.it/"

		"https://dbb.dip.unipv.it/"
		// "https://dbb.dip.unipv.it/it/ricerca/tematiche-di-ricerca-e-laboratori/biologia-vegetale/laboratorio-di-biotecnologie-vegetali"

		// "https://www.jku.at/institut-fuer-elektrische-antriebe-und-leistungselektronik/"
	)

	.then(url => ({ profile: url }))

	.then(analyze)
	.then(dump("work.md"))

	.then(structure)
	.then(dump("work.json"))

	.then(leads => `<${leads.length}> leads`)

	.then(console.info)
	.catch(console.error);
