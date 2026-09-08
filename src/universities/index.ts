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

import * as dict from "@/universities/index.core.js";
import type { Tag } from "@metreeca/core/language";
import type { IRI } from "@metreeca/core/resource";
import { type Text } from "@metreeca/core/strings";
import { immutable } from "@metreeca/core/structures";

export * from "@/universities/index.core.js";


export const universities = immutable(Object.fromEntries(
	Object.values(dict).map(university => [university.id, university])
));


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// !!! name/description/legalName/location: the schema.org organization surface awaits a shared vocabulary module

export type University = {

	readonly id: IRI;

	readonly generated?: boolean;

	readonly identifier?: Text;

	readonly prefLabel: Text;
	readonly altLabel?: Text;
	readonly definition?: Text;

	readonly homepage: readonly IRI[];
	readonly depiction: readonly IRI[];
	readonly isDefinedBy?: IRI;
	readonly seeAlso?: readonly IRI[];

	readonly mbox?: readonly Text[];
	readonly phone?: readonly Text[];

	readonly inception: number;
	readonly students: number;

	readonly latitude: number;
	readonly longitude: number;

	readonly city: GeoReference;
	readonly country: GeoReference;

	readonly locale: Tag;
	readonly zone: string;

	readonly classification?: readonly IRI[];

	readonly subOrganizationOf?: readonly IRI[];
	readonly hasSubOrganization?: readonly IRI[];
	readonly hasUnit?: readonly IRI[];

	readonly hasHead?: readonly IRI[];
	readonly hasMember?: readonly IRI[];

}


export type GeoReference = {

	readonly id: IRI;

	readonly label?: Text;

	readonly latitude: number;
	readonly longitude: number;

}
