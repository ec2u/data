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

import { pipe } from "@metreeca/flow";
import { items } from "@metreeca/flow/feeds";
import { toArray } from "@metreeca/flow/sinks";
import { flat, map } from "@metreeca/flow/tasks";
import { html, xpath } from "@metreeca/mime-xml";
import { describe, expect, it } from "vitest";
import { card, credits, period } from "./pavia-portal.core.js";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

describe("card", () => {

	async function read(markup: string) {
		return pipe(
			(items([`<html><body>${markup}</body></html>`]))
			(html("https://portale.unipv.it/it/didattica/post-laurea/master-universitari/offerta-didattica"))
			(xpath())
			(flat(map(path => path("//*[contains(@class, 'card-corsi')]").map(node => card(xpath(node))))))
			(toArray())
		);
	}

	it("reads a master card", async () => {
		expect(await read(`
			<div class="col-12 card-corsi">
				<div class="elenco-corsi__card flex-grow-1">
					<div class="elenco-corsi__tipologia">Master 1° livello - A.A. 2026/27</div>
					<div class="elenco-corsi__nome">Energy and Environmental Management and Economics – MEDEA</div>
					<div class="elenco-corsi__area fw-semibold">Durata Annuale (60 CFU)</div>
					<div class="elenco-corsi__lingua">
						<span class="elenco-corsi__label fst-italic">Lingua:</span>
						<div class="fw-semibold">Inglese</div>
					</div>
				</div>
				<div class="rubrica__button">
					<a href="/it/didattica/post-laurea/master-universitari/offerta-master-e-corsi-di-perfezionamento/medea">Vai al corso &gt;</a>
				</div>
			</div>
		`)).toEqual([{
			url: "https://portale.unipv.it/it/didattica/post-laurea/master-universitari/offerta-master-e-corsi-di-perfezionamento/medea",
			type: "Master 1° livello",
			year: "2026/2027",
			name: "Energy and Environmental Management and Economics – MEDEA",
			notes: ["Durata Annuale (60 CFU)", "Lingua: Inglese"]
		}]);
	});

	it("reads a card stating no academic year", async () => {
		expect(await read(`
			<div class="col-12 card-corsi">
				<div class="elenco-corsi__card">
					<div class="elenco-corsi__tipologia">Laureati medici</div>
					<div class="elenco-corsi__nome">CARDIOCHIRURGIA</div>
					<div class="elenco-corsi__lingua"><span class="elenco-corsi__label">Durata</span><div>5 anni</div></div>
				</div>
				<div class="rubrica__button"><a href="/it/didattica/post-laurea/scuole-di-specializzazione/cardiochirurgia-0">Vai</a></div>
			</div>
		`)).toEqual([{
			url: "https://portale.unipv.it/it/didattica/post-laurea/scuole-di-specializzazione/cardiochirurgia-0",
			type: "Laureati medici",
			name: "CARDIOCHIRURGIA",
			notes: ["Durata 5 anni"]
		}]);
	});

	it("reads nothing from a card linking no page", async () => {
		expect(await read(`
			<div class="col-12 card-corsi">
				<div class="elenco-corsi__card"><div class="elenco-corsi__nome">Cardiochirurgia</div></div>
			</div>
		`)).toEqual([undefined]);
	});

});

describe("period", () => {

	it("reads calendar durations", async () => {
		expect(period(["Durata Annuale (60 CFU)"])).toBe("P1Y");
		expect(period(["Durata Biennale (120 CFU)"])).toBe("P2Y");
		expect(period(["Area medica", "Durata 5 anni"])).toBe("P5Y");
		expect(period(["Durata 1 anno"])).toBe("P1Y");
	});

	it("reads nothing from unknown durations", async () => {
		expect(period(["Durata Semestrale (30 CFU)"])).toBeUndefined();
		expect(period(["Lingua: Inglese"])).toBeUndefined();
	});

});

describe("credits", () => {

	it("reads stated credits", async () => {
		expect(credits(["Durata Annuale (60 CFU)"])).toBe(60);
		expect(credits(["Durata Annuale (17,5 CFU)"])).toBe(17.5);
	});

	it("reads nothing from missing or zero credits", async () => {
		expect(credits(["Durata 5 anni"])).toBeUndefined();
		expect(credits(["Durata Annuale (0 CFU)"])).toBeUndefined();
	});

});
