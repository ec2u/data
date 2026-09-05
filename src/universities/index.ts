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

import { ec2u } from "@/index.js";
import type { Tag } from "@metreeca/core/language";
import type { IRI } from "@metreeca/core/resource";
import { markdown, type Text } from "@metreeca/core/strings";
import { immutable } from "@metreeca/core/structures";


export const Universities = immutable({

	coimbra: {

		id: `${ec2u}/universities/coimbra`,

		prefLabel: "University of Coimbra",
		altLabel: "Coimbra",

		definition: markdown`
			Focused on the future and recognized as major promoter of change, the University of Coimbra has more than
			7 centuries of experience in the creation and dissemination of knowledge, culture, science and technology
			through study, teaching, cutting-edge research and innovation in the most diverse areas of knowledge.
		`,

		homepage: ["https://www.uc.pt/en/", "https://www.uc.pt/pt"],
		depiction: ["/blobs/coimbra.png"],
		seeAlso: ["http://www.wikidata.org/entity/Q368643"],

		locale: "pt",
		zone: "Europe/Lisbon"

	},

	iasi: {

		id: `${ec2u}/universities/iasi`,

		prefLabel: "Alexandru Ioan Cuza University of Iaşi",
		altLabel: "Iași",

		definition: markdown`
			Alexandru Ioan Cuza University of Iași, the first modern university founded in Romania (in 1860), is
			constantly ranked 1 – 3 among Romanian universities in terms of research, education and institutional
			transparency. With about 23000 students and 2000 full-time staff in its 15 faculties, our university's
			academic offer includes 80 degrees at bachelor level (4 in English, 1 in French), 116 master level
			programmes (14 in English, 1 in French) and 27 fields of study at the doctoral level (all offered in
			English as well).
		`,

		homepage: ["https://www.uaic.ro/en/", "https://www.uaic.ro/"],
		depiction: ["/blobs/iasi.png"],
		seeAlso: ["http://www.wikidata.org/entity/Q1523902"],

		locale: "ro",
		zone: "Europe/Bucharest"

	},

	jena: {

		id: `${ec2u}/universities/jena`,

		prefLabel: "Friedrich Schiller University Jena",
		altLabel: "Jena",

		definition: markdown`
			Founded in 1558, the Friedrich Schiller University Jena is one of the oldest universities in Germany.
			Once the centre of German philosophical thought, it has become a broad-based, research-intensive
			institution with a global reach and a thriving international community of more than 18,000 undergraduate
			and postgraduate students from over 110 countries worldwide.
		`,

		homepage: ["https://www.uni-jena.de/en", "https://www.uni-jena.de/"],
		depiction: ["/blobs/jena.png"],
		seeAlso: ["http://www.wikidata.org/entity/Q154561"],

		locale: "de",
		zone: "Europe/Berlin"

	},

	linz: {

		id: `${ec2u}/universities/linz`,

		prefLabel: "Johannes Kepler University Linz (JKU)",
		altLabel: "Linz",

		definition: markdown`
			The Johannes Kepler University Linz (JKU), with 24,000 students, offers diverse programs in law,
			business, social sciences, engineering, natural sciences, and medicine. It prioritizes impactful research
			in AI, medical tech, and sustainable polymers, with a focus on social and environmental responsibility.
			The university aims for climate neutrality by 2030 and actively engages students in groundbreaking
			endeavors, fostering a passion for shaping the future.
		`,

		homepage: ["https://www.jku.at/en", "https://www.jku.at"],
		depiction: ["/blobs/linz.png"],
		seeAlso: ["http://www.wikidata.org/entity/Q682739"],

		locale: "de",
		zone: "Europe/Vienna"

	},

	pavia: {

		id: `${ec2u}/universities/pavia`,

		prefLabel: "University of Pavia",
		altLabel: "Pavia",

		definition: markdown`
			The University of Pavia (UNIPV) is one of the world's oldest academic institutions: it was founded in
			1361 and until the 20th century it was the only University in the Milan Area and the region of Lombardy.
		`,

		homepage: ["https://web-en.unipv.it", "https://portale.unipv.it/it"],
		depiction: ["/blobs/pavia.png"],
		seeAlso: ["http://www.wikidata.org/entity/Q219317"],

		locale: "it",
		zone: "Europe/Rome"

	},

	poitiers: {

		id: `${ec2u}/universities/poitiers`,

		prefLabel: "University of Poitiers",
		altLabel: "Poitiers",

		definition: markdown`
			Founded in 1431, the University of Poitiers is a multidisciplinary university which enrols 29,000
			students, 4200 of which are international students from 120 different countries, supervised by 2700 staff
			members (administrative, teaching staff and researchers). Poitiers ranks 2nd in the overall ranking of
			major student cities in France in 2018-2019 and is above the national average with 16% of foreign
			students.
		`,

		homepage: ["https://www.univ-poitiers.fr/en/", "https://www.univ-poitiers.fr"],
		depiction: ["/blobs/poitiers.png"],
		seeAlso: ["http://www.wikidata.org/entity/Q661056"],

		locale: "fr",
		zone: "Europe/Paris"

	},

	salamanca: {

		id: `${ec2u}/universities/salamanca`,

		prefLabel: "University of Salamanca",
		altLabel: "Salamanca",

		definition: markdown`
			The University of Salamanca was founded in 1218 and is one of the three oldest universities in Europe,
			boasting a wide range of Faculties and Research Institutes in Sciences and Arts. In 2011, it was awarded
			the Campus of International Excellence status. It is the university of reference in its region and beyond
			(Castile and León) and the "Alma Mater" of nearly all historical Latin American universities.
		`,

		homepage: ["https://www.usal.es"],
		depiction: ["/blobs/salamanca.png"],
		seeAlso: ["http://www.wikidata.org/entity/Q308963"],

		locale: "es",
		zone: "Europe/Madrid"

	},

	turku: {

		id: `${ec2u}/universities/turku`,

		prefLabel: "University of Turku",
		altLabel: "Turku",

		definition: markdown`
			The University of Turku (UTU) is a renowned research institution with a diverse community of 25,000
			individuals from over 100 countries. Situated in Turku's historic city center, it offers study and
			research options across seven faculties and special units. With its convenient campus, exceptional
			services, and vibrant academic environment, UTU ensures that international students and scholars feel
			welcomed and supported throughout their time in Finland.
		`,

		homepage: ["https://www.utu.fi/en", "https://www.utu.fi/fi"],
		depiction: ["/blobs/turku.png"],
		seeAlso: ["http://www.wikidata.org/entity/Q501841"],

		locale: "fi",
		zone: "Europe/Helsinki"

	},

	umea: {

		id: `${ec2u}/universities/umea`,

		prefLabel: "Umeå University",
		altLabel: "Umeå",

		definition: markdown`
			Umeå University is a comprehensive university with around 38,000 students and 4,600 staff. It offers over
			40 undergraduate and Master’s degree programmes in a wide range of academic fields, including science and
			technology, the social sciences, business, health and medicine, and the arts and humanities. In total,
			the university provides 150 study programmes and 1,800 courses. The international students at Umeå
			University have bestowed the institution with outstanding ratings across various categories in the
			International Student Barometer (ISB). Umeå University has been ranked first of all participating
			universities in the world for student satisfaction, living and support.
		`,

		homepage: ["https://www.umu.se/en", "https://www.umu.se"],
		depiction: ["/blobs/umea.png"],
		seeAlso: ["http://www.wikidata.org/entity/Q1144565"],

		locale: "sv",
		zone: "Europe/Stockholm"

	}

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// !!! name/description/legalName/location: the schema.org organization surface awaits a shared vocabulary module

export interface University {

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


export interface GeoReference {

	readonly id: IRI;

	readonly label?: Text;

	readonly latitude: number;
	readonly longitude: number;

}
