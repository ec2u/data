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

import { base } from "@/vocabularies/ec2u.js";
import { assert, isDefined } from "@metreeca/core";
import type { Tag } from "@metreeca/core/language";
import { immutable } from "@metreeca/core/structures";
import type { Reference } from "@metreeca/qest/resource";


export type University = {

	readonly id: Reference
	readonly locale: Tag
	readonly zone: string // !!! type

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const coimbra = immutable({
	id: `${base}/universities/coimbra`,
	locale: "pt",
	zone: "Europe/Lisbon"
});

export const iasi = immutable({
	id: `${base}/universities/iasi`,
	locale: "ro",
	zone: "Europe/Bucharest"
});

export const jena = immutable({
	id: `${base}/universities/jena`,
	locale: "de",
	zone: "Europe/Berlin"
});

export const linz = immutable({
	id: `${base}/universities/linz`,
	locale: "de",
	zone: "Europe/Vienna"
});

export const pavia = immutable({
	id: `${base}/universities/pavia`,
	locale: "it",
	zone: "Europe/Rome"
});

export const poitiers = immutable({
	id: `${base}/universities/poitiers`,
	locale: "fr",
	zone: "Europe/Paris"
});

export const salamanca = immutable({
	id: `${base}/universities/salamanca`,
	locale: "es",
	zone: "Europe/Madrid"
});

export const turku = immutable({
	id: `${base}/universities/turku`,
	locale: "fi",
	zone: "Europe/Helsinki"
});

export const umea = immutable({
	id: `${base}/universities/umea`,
	locale: "sv",
	zone: "Europe/Stockholm"
});


export const universities = immutable(Object.fromEntries(
	[coimbra, iasi, jena, linz, pavia, poitiers, salamanca, turku, umea].map(
		university => [university.id, university]
	)
));


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function getUniversity(id: Reference) {

	return assert(universities[id], isDefined, `unknown university <${id}>`);

}
