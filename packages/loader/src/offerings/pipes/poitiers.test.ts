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

import { getTopicId } from "@ec2u/data-shared/taxonomies/index.js";
import { isced2011 } from "@ec2u/data-shared/taxonomies/isced-2011.js";
import { poitiers } from "@ec2u/data-shared/universities/index.core.js";
import { describe, expect, it } from "vitest";
import { program } from "./poitiers.core.js";


const entry = {
	composante: "Droit et Sciences Sociales Poitiers",
	name: "Diplôme d'Etude Supérieur Notariat DSN",
	code: "DDV10",
	discipline: "Droit - Sciences politiques",
	credits: 60,
	levelISCED: 7,
	options: []
};


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

describe("program", () => {

	it("reads the facts the entry states", async () => {
		expect(program(entry)).toEqual({
			kind: "program",
			university: poitiers,
			key: "DDV10",
			identifier: "DDV10",
			name: { fr: "DDV10 - Diplôme d'Etude Supérieur Notariat DSN" },
			numberOfCredits: 60,
			educationalLevel: [getTopicId(isced2011, "7")],
			provider: { name: { fr: "Droit et Sciences Sociales Poitiers" } },
			cues: { field: "Droit - Sciences politiques" }
		});
	});

	it("leaves out unusable facts", async () => {

		const read = program({ ...entry, credits: 0, levelISCED: 12, discipline: null, composante: " " });

		expect(read).not.toHaveProperty("numberOfCredits");
		expect(read).not.toHaveProperty("provider");
		expect(read).not.toHaveProperty("cues");
		expect(read).toMatchObject({ educationalLevel: [] });

	});

	it("reads no program without a code or a name", async () => {
		expect(program({ ...entry, code: "" })).toBeUndefined();
		expect(program({ ...entry, name: " " })).toBeUndefined();
	});

});
