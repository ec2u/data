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
import { sdgs } from "@ec2u/data-shared/taxonomies/sdgs.js";
import { pavia } from "@ec2u/data-shared/universities/index.core.js";
import { pipe } from "@metreeca/flow";
import { items } from "@metreeca/flow/feeds";
import { toArray } from "@metreeca/flow/sinks";
import { xml, xpath } from "@metreeca/mime-xml";
import { describe, expect, it } from "vitest";
import type { CourseDraft, ProgramDraft } from "../sinks/sync.js";
import { courses, pages, program, programs, qualify } from "./pavia.js";


const catalogue = "https://unipv.coursecatalogue.cineca.it";

const record = {
	aaOffId: 2026,
	cdsCod: "08402",
	cdsDes: "FISICA",
	dipCod: "688916",
	dipDes: "DIPARTIMENTO DI FISICA \"ALESSANDRO VOLTA\"",
	tipoCorsoCod: "L2"
};


function af(code: string, { cycle = "S1", sdg = "4" }: { readonly cycle?: string, readonly sdg?: string } = {}) {
	return `
		<ns2:af>
			<ns2:afGenCod>${code}</ns2:afGenCod>
			<ns2:afGenDes>METODI MATEMATICI ${code}</ns2:afGenDes>
			<ns2:afGenDesEng>MATHEMATICAL METHODS ${code}</ns2:afGenDesEng>
			<ns2:oreFrontAf>24.0</ns2:oreFrontAf>
			<ns2:oreStuInd>45.5</ns2:oreStuInd>
			<ns2:tipoCicloCod>${cycle}</ns2:tipoCicloCod>
			<ns2:testi>
				<ns2:testo><ns2:tipoTestoCod>CONTENUTI</ns2:tipoTestoCod><ns2:linguaCod>ita</ns2:linguaCod><ns2:contenuto>Contenuti.</ns2:contenuto></ns2:testo>
				<ns2:testo><ns2:tipoTestoCod>CONTENUTI</ns2:tipoTestoCod><ns2:linguaCod>eng</ns2:linguaCod><ns2:contenuto>Contents.</ns2:contenuto></ns2:testo>
				<ns2:testo><ns2:tipoTestoCod>METODI_DID</ns2:tipoTestoCod><ns2:linguaCod>eng</ns2:linguaCod><ns2:contenuto>Lectures.</ns2:contenuto></ns2:testo>
				<ns2:testo><ns2:tipoTestoCod>OBIETT_FORM</ns2:tipoTestoCod><ns2:linguaCod>eng</ns2:linguaCod><ns2:contenuto>Outcomes.</ns2:contenuto></ns2:testo>
				<ns2:testo><ns2:tipoTestoCod>PREREQ</ns2:tipoTestoCod><ns2:linguaCod>eng</ns2:linguaCod><ns2:contenuto>Calculus.</ns2:contenuto></ns2:testo>
				<ns2:testo><ns2:tipoTestoCod>MOD_VER_APPR</ns2:tipoTestoCod><ns2:linguaCod>eng</ns2:linguaCod><ns2:contenuto>Oral exam.</ns2:contenuto></ns2:testo>
				<ns2:testo><ns2:tipoTestoCod>OB_SVIL_SOS</ns2:tipoTestoCod><ns2:linguaCod>ita</ns2:linguaCod><ns2:contenuto>${sdg}</ns2:contenuto></ns2:testo>
			</ns2:testi>
			<ns2:linDid><ns2:linDidAf><ns2:linDidDes>ITALIANO</ns2:linDidDes></ns2:linDidAf></ns2:linDid>
			<ns2:modDid><ns2:modDidAf><ns2:modDidDes>Convenzionale</ns2:modDidDes></ns2:modDidAf></ns2:modDid>
		</ns2:af>
	`;
}

function plan(regulations: string): string {
	return `
		<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body>
		<ns2:ProgrammazioneDidatticaResponse xmlns:ns2="http://ws.di.u-gov.cineca.it/"><ProgdidRoot>
		<ns2:cds><ns2:aaOffId>2026</ns2:aaOffId><ns2:cdsCod>08402</ns2:cdsCod>${regulations}</ns2:cds>
		</ProgdidRoot></ns2:ProgrammazioneDidatticaResponse>
		</soap:Body></soap:Envelope>
	`;
}

function regulation(ordinamento: string, year: string, tracks: string): string {
	return `<ns2:regdid><ns2:cdsordCod>${ordinamento}</ns2:cdsordCod><ns2:aaRegdidId>${year}</ns2:aaRegdidId>${tracks}</ns2:regdid>`;
}

function track(code: string, activities: string): string {
	return `<ns2:pds><ns2:pdsCod>${code}</ns2:pdsCod>${activities}</ns2:pds>`;
}

async function read(text: string) {
	return courses((await pipe(
		(items([text]))
		(xml())
		(xpath())
		(toArray())
	))[0]);
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

describe("program", () => {

	it("reads the facts the record states", async () => {
		expect(program(record, `${catalogue}/corsi-code/2026/08402`)).toEqual({
			kind: "program",
			university: pavia,
			key: "08402",
			year: "2026/2027",
			identifier: "08402",
			name: { it: "FISICA" },
			url: [`${catalogue}/corsi-code/2026/08402`],
			educationalLevel: [getTopicId(isced2011, "6")],
			provider: { name: { it: "DIPARTIMENTO DI FISICA \"ALESSANDRO VOLTA\"" } }
		});
	});

	it("states no page where none is confirmed", async () => {
		expect(program(record)).toMatchObject({ url: [] });
	});

	it("states no provider for the placeholder department", async () => {
		expect(program({ ...record, dipCod: "NN" })).not.toHaveProperty("provider");
	});

	it("maps program types to ISCED 2011 levels", async () => {

		const level = (tipoCorsoCod: string) => program({ ...record, tipoCorsoCod })?.educationalLevel;

		expect(level("LM")).toEqual([getTopicId(isced2011, "7")]);
		expect(level("D1")).toEqual([getTopicId(isced2011, "8")]);
		expect(level("CS")).toEqual([getTopicId(isced2011, "9")]);
		expect(level("SFM")).toEqual([]);

	});

	it("reads no program without a code, a name or an offer year", async () => {
		expect(program({ ...record, cdsCod: "" })).toBeUndefined();
		expect(program({ ...record, cdsDes: null })).toBeUndefined();
		expect(program({ ...record, aaOffId: "next" })).toBeUndefined();
	});

});


describe("pages", () => {

	it("tries the offer year and the three before it", async () => {
		expect(pages(record)).toEqual([2026, 2025, 2024, 2023].map(cohort => ({
			cohort,
			probe: `${catalogue}/api/v1/corso-code?anno=${cohort}&cdsCod=08402`,
			url: `${catalogue}/corsi-code/${cohort}/08402`
		})));
	});

	it("lists no page for a program type the catalogue does not publish", async () => {
		expect(pages({ ...record, tipoCorsoCod: "D1" })).toEqual([]);
	});

});


describe("courses", () => {

	it("reads the facts the plan states", async () => {

		const [activity] = await read(plan(regulation("08402-24", "2024", track("01", af("502004")))));

		expect(activity?.draft).toEqual({

			kind: "course",

			university: pavia,
			key: "08402/502004",
			year: "2026/2027",
			term: ["First"],

			courseCode: "502004",
			name: { en: "MATHEMATICAL METHODS 502004", it: "METODI MATEMATICI 502004" },

			teaches: { it: "Contenuti.", en: "Contents.\n\nLectures." },
			assesses: { en: "Outcomes." },
			coursePrerequisites: { en: "Calculus." },
			competencyRequired: { en: "Oral exam." },

			timeRequired: "PT24H",
			courseWorkload: "PT45H30M",
			inLanguage: ["it"],
			courseMode: "OfflineEventAttendanceMode",

			about: [getTopicId(sdgs, "4")],
			inProgram: [{ key: "08402", year: "2026/2027" }]

		});

	});

	it("keys the catalogue page by ordinamento year and track", async () => {

		const [activity] = await read(plan(regulation("01400-08", "2024", track("01", af("502004")))));

		expect(activity?.page).toEqual({
			probe: `${catalogue}/api/v1/insegnamento-code`
				+"?aa_offerta=2026&cod_af=502004&aa_ordinamento=2008&af_percorso=01&cod_corso=08402",
			url: `${catalogue}/insegnamenti-code/2026/502004/2008/01/08402`
		});

	});

	it("publishes common activities under the first actual track", async () => {

		const [activity] = await read(plan(regulation("08402-24", "2024",
			track("00", af("502004"))+track("03", "")+track("02", "")
		)));

		expect(activity?.page?.url).toBe(`${catalogue}/insegnamenti-code/2026/502004/2024/02/08402`);

	});

	it("reads an activity listed by several regulations once, from the most recent", async () => {

		const activities = await read(plan(
			regulation("08402-21", "2021", track("01", af("502004", { cycle: "S2" })))
			+regulation("08402-24", "2024", track("01", af("502004", { cycle: "A1" })))
		));

		expect(activities).toHaveLength(1);
		expect(activities[0]?.draft).toMatchObject({ term: ["Annual"] });

	});

	it("reads the SDGs a sustainability text numbers", async () => {

		const [activity] = await read(plan(regulation("08402-24", "2024",
			track("01", af("502004", { sdg: "4.1, 11 e 99; 17" }))
		)));

		expect(activity?.draft.about).toEqual([getTopicId(sdgs, "4"), getTopicId(sdgs, "11"), getTopicId(sdgs, "17")]);

	});

	it("states no page for an unreadable ordinamento", async () => {

		const [activity] = await read(plan(regulation("08402", "2024", track("01", af("502004")))));

		expect(activity?.page).toBeUndefined();

	});

});


describe("programs", () => {

	const draft = (key: string, name: string): ProgramDraft => ({ kind: "program", university: pavia, key, name: { it: name } });

	it("qualifies shared names with the cohort", async () => {
		expect(programs([
			{ draft: draft("08402", "FISICA"), cohort: 2026 },
			{ draft: draft("08499", "FISICA"), cohort: 2023 },
			{ draft: draft("08403", "CHIMICA"), cohort: 2026 }
		]).map(({ name }) => name)).toEqual([
			{ it: "FISICA (2026/2027)" },
			{ it: "FISICA (2023/2024)" },
			{ it: "CHIMICA" }
		]);
	});

	it("leaves a shared name as it stands where no cohort is known", async () => {
		expect(programs([
			{ draft: draft("08402", "FISICA") },
			{ draft: draft("08499", "FISICA"), cohort: 2023 }
		]).map(({ name }) => name)).toEqual([{ it: "FISICA" }, { it: "FISICA (2023/2024)" }]);
	});

});


describe("qualify", () => {

	const program = (key: string, name: { readonly [tag: string]: string }): ProgramDraft => ({
		kind: "program", university: pavia, key, year: "2026/2027", name
	});

	const course = (key: string, name: { readonly [tag: string]: string }, inProgram: string): CourseDraft => ({
		kind: "course", university: pavia, key, year: "2026/2027", name, inProgram: [{ key: inProgram, year: "2026/2027" }]
	});

	it("qualifies shared names with the program name in the same language", async () => {
		expect(qualify([
			course("A/1", { en: "THESIS", it: "TESI" }, "A"),
			course("B/1", { en: "THESIS", it: "TESI" }, "B"),
			course("A/2", { en: "PHYSICS", it: "FISICA" }, "A")
		], [
			program("A", { en: "MATHEMATICS", it: "MATEMATICA" }),
			program("B", { it: "CHIMICA" })
		]).map(({ name }) => name)).toEqual([
			{ en: "THESIS (MATHEMATICS)", it: "TESI (MATEMATICA)" },
			{ en: "THESIS (CHIMICA)", it: "TESI (CHIMICA)" },
			{ en: "PHYSICS", it: "FISICA" }
		]);
	});

});
