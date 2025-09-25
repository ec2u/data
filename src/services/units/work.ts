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

import { select } from "@/services/units/2-select";
import { analyze } from "@/services/units/3-analyze";
import { Page } from "@/utilities/core/fetch";
import { log, message } from "@/utilities/core/log";
import { Memo, pipe } from "@/utilities/core/pipe";
import { DatastoreCache } from "@/utilities/gcp/cache";
import { explore } from "./1-explore";


pipe(
	// "https://microwave.unipv.it"
	// "https://dbb.dip.unipv.it/it/ricerca/tematiche-di-ricerca-e-laboratori/biologia-vegetale",
	"https://dbbs.dip.unipv.it/"
	// "https://giurisprudenza.dip.unipv.it/"
	// "https://www.jku.at/institut-fuer-elektrische-antriebe-und-leistungselektronik/"

	, {

		label: "units",
		cache: DatastoreCache<Memo>({ kind: "Memo" })

	}
)

	.task(explore)
	.task(select)

	.then(async urls => {

		const cache=DatastoreCache<Page>({ kind: "Page" }); // !!!

		return await Promise.all(
			urls.map(url => cache.lookup(url).catch(error => {

				log.error(analyze.name, `unable to look up <${url}>: ${message(error)}`);

				throw error;

			}))
		);

	})

	.task(analyze)

	.then(console.log)
	.catch(console.error);
