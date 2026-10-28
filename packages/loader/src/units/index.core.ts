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

import { alliance } from "@ec2u/data-shared/organizations/index.js";
import { getTopicId } from "@ec2u/data-shared/taxonomies/index.js";
import { organizations } from "@ec2u/data-shared/taxonomies/organizations.js";
import { Unit, units, Units } from "@ec2u/data-shared/units/index.js";
import { resolve } from "@metreeca/core/resource";
import { dedent } from "@metreeca/core/strings";
import { immutable } from "@metreeca/core/values";
import { pipe } from "@metreeca/flow";
import { items } from "@metreeca/flow/feeds";
import { map, mix } from "@metreeca/flow/tasks";
import { validate } from "@metreeca/mime-jsonld";
import { delta, settle } from "@metreeca/pipe-store";
import { execute } from "../index.core.js";


const VirtualInstitute = getTopicId(organizations, "university-unit/institute/virtual");


/**
 * The EC2U virtual institutes, units of the alliance itself that university units take part in.
 */
export const VirtualInstitutes = immutable([

	{
		id: resolve(units.id, "glade"),
		label: "GLADE",
		prefLabel: { en: "Virtual Institute for Good Health and Well‑Being" },
		altLabel: "GLADE",
		definition: {
			en: dedent`
				GLADE is the EC2U Alliance’s Virtual Institute aimed to develop specific approaches in education,
				research, innovation and service transfer to the community in areas of the third UNSDG: Good Health
				and Well-being for All.

				The Virtual Institute GLADE is the headquarter for:

				- EC2U Glade Literacy LAB that encourages itinerant conferences of EC2U specialists, Summer Schools
				  and short video trainings in the area of good health and well-being for all;
				- EC2U GLADE Transformative Research HUB that initiates and supports studies, guidelines for local
				  authorities, policy papers on Good Health and Well-being;
				- EC2U GLADE Healthy Campus Services that focuses on a brand new approach of Health in Campuses.

				The main objective of the GLADE Virtual Institute is to develop cooperation’s contexts for promoting
				health and well-being in the 7 EC2U universities and their cities.
			`
		},
		homepage: ["https://ec2u.eu/virtual-institutes-staff/glade-for-researchers-staff/"]
	},

	{
		id: resolve(units.id, "viqe"),
		label: "VIQE",
		prefLabel: { en: "Virtual Institute for Quality Education" },
		altLabel: "VIQE",
		definition: {
			en: dedent`
				Virtual Institutes are a completely new way of approaching and solving a given challenge. The VIQE,
				Virtual Institute for Quality Education combines education, research and innovation for advanced
				studies in quality education.

				In practice, VIQE will carry out the following activities:

				- Language Policy Research Project
				- Research Seed Mobility Programme on Language and Cultural Diversity
				- Joint PhD training activities for the existing PhD programmes on European languages and cultures.
			`
		},
		homepage: ["https://ec2u.eu/virtual-institutes-staff/virtual-institute-for-quality-education-viqe/"]
	},

	{
		id: resolve(units.id, "viscc"),
		label: "VISCC",
		prefLabel: { en: "Virtual Institute for Sustainable Cities and Communities" },
		altLabel: "VISCC",
		definition: {
			en: dedent`
				The Virtual Institute for Sustainable Cities and Communities (VISCC) aims at bringing together
				research, education and innovation, and outreaching in the field of the United Nation’s sustainable
				development goal n°11: “Sustainable Cities and Communities”.

				The VISCC carries out scientific activities that promote interdisciplinarity, collaborative work and
				mobility between the EC2U Partner Universities, the cities and the citizens.

				What does the VISCC offer?

				- A Joint Master Degree in Sustainable Cities and Communities
				- PhD training activities and thesis projects in co-supervision
				- Online courses
				- Winter and Summer Schools
				- Research projects
			`
		},
		homepage: ["https://ec2u.eu/virtual-institutes-staff/virtual-institute-for-sustainable-cities-and-communities/"]
	},

	{
		id: resolve(units.id, "vipjsi"),
		label: "VIPJSI",
		prefLabel: { en: "Virtual Institute for Peace, Justice and Strong Institutions" },
		altLabel: "VIPJSI",
		definition: {
			en: dedent`
				The Virtual Institute for Peace, Justice and Strong Institutions (VIPJSI) carries out scientific
				activities that promote interdisciplinarity, collaborative work and mobility between the EC2U Partner
				Universities, the cities and the citizens.

				The VIPJSI aims at bringing together interdisciplinary research, education and innovation, and
				outreaching in the field of the United Nation’s Sustainable Development Goal #16: Promote peaceful and
				inclusive societies for sustainable development, provide access to justice for all and build
				effective, accountable and inclusive institutions at all levels.

				Our research deals with current questions regarding Peace, Justice and Strong Institutions in Europe
				from different points of view: law, politics, history and ethics.

				The VIPJSI offers:

				- A Joint Master Program in Peace, Justice and Good Governance (starting 2027)
				- PhD training activities and thesis projects in co-supervision (starting 2025)
				- Online courses
				- Winter and Summer Schools
				- Thinktanks & Conferences
			`
		},
		homepage: ["https://ec2u.eu/virtual-institutes-staff/virtual-institute-for-peace-justice-and-strong-institutions/"]
	}

].map(institute => ({

	...institute,

	dataset: units.id,

	unitOf: [alliance.id],
	classification: [VirtualInstitute]

})));


if ( import.meta.main ) {
	await execute(Metadata);
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export async function Metadata() {

	return pipe(
		(items([units]))
		(validate(Units))
		(map(catalogue => delta(units.id, Units, catalogue)))
		(mix(pipe(
			(items(VirtualInstitutes))
			(validate(Unit))
			(map(institute => delta(institute.id, Unit, institute)))
		)))
		(settle({ atomic: true }))
	);

}
