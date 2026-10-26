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

import { taxonomies } from "@ec2u/data-shared/taxonomies/index.core.js";
import { Topic } from "@ec2u/data-shared/taxonomies/index.js";
import { resource } from "@metreeca/blue/resource";
import { resolve } from "@metreeca/core/resource";
import { dedent } from "@metreeca/core/strings";
import { immutable } from "@metreeca/core/values";


export const euroscivoc = immutable({ // !!! sync from the EU vocabularies RDF distribution

	id: resolve(taxonomies.id, "euroscivoc"),

	dataset: taxonomies.id,

	label: "EuroSciVoc",

	title: { en: "European Science Vocabulary" },
	alternative: { en: "EuroSciVoc" },
	description: { en: dedent`
		European Science Vocabulary (EuroSciVoc) is the taxonomy of fields of science based on OECD's 2015 Frascati
		Manual taxonomy. It was extended with fields of science categories extracted from CORDIS content through a
		semi-automatic process developed with Natural Language Processing (NLP) techniques.
	` },

	publisher: "https://op.europa.eu/", // the Publications Office of the European Union
	rights: "Copyright © 2023 Publications Office of the European Union",

	source: "https://op.europa.eu/en/web/eu-vocabularies/dataset/-/resource"
		+"?uri=http://publications.europa.eu/resource/dataset/euroscivoc",

	issued: "2024-10-02",
	version: "1.6-20250924"

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function EuroSciVocTopic() {
	return resource(Topic, { pattern: `${euroscivoc.id}/*` }, {});
}
