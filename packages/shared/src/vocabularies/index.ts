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

import { ec2u, rdfs } from "@ec2u/data-shared";
import { dcat } from "@ec2u/data-shared/vocabularies/dcat.js";
import { dct } from "@ec2u/data-shared/vocabularies/dct.js";
import { foaf } from "@ec2u/data-shared/vocabularies/foaf.js";
import { org } from "@ec2u/data-shared/vocabularies/org.js";
import { schema } from "@ec2u/data-shared/vocabularies/schema/index.js";
import { skos } from "@ec2u/data-shared/vocabularies/skos.js";
import { createLexicon } from "@metreeca/core/resource";
import { geo } from "@metreeca/work/open/geo.js";


/**
 * The prefixes abbreviating the namespaces of the data model, for writing its IRIs as prefixed names.
 */
export const lexicon = createLexicon({

	ec2u,
	rdfs,
	dcat,
	dct,
	foaf,
	org,
	schema,
	skos,
	geo

});
