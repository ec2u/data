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

import { base } from "@ec2u/data-shared";
import { getAcademicYear } from "@ec2u/data-shared/offerings/index.js";
import { resolve } from "@metreeca/core/resource";
import { clip } from "@metreeca/core/strings";
import { pipe } from "@metreeca/flow";
import { items } from "@metreeca/flow/feeds";
import { flat, map } from "@metreeca/flow/tasks";
import { service } from "@metreeca/gear";
import { createVault } from "@metreeca/gear/vault";
import { fetch } from "@metreeca/pipe-url";
import { log } from "@metreeca/tape";
import { execute } from "../../index.core.js";
import { type Draft, sync } from "../sinks/sync.js";
import { offering, type OfferingRecord } from "./coimbra.core.js";


const Source = resolve(base, "/offerings/coimbra");

const DataURL = "offerings-coimbra-url";
const DataId = "offerings-coimbra-id";
const DataToken = "offerings-coimbra-token";


const logger = log(import.meta.url);


/**
 * A response of the Coimbra courses API.
 */
type Results = {

	readonly status?: null | string
	readonly listaResultados?: null | readonly OfferingRecord[]

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

if ( import.meta.main ) {
	await execute(Coimbra);
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Harvests the programs and courses listed by the Coimbra courses API for the current academic year.
 *
 * Asks the API for the offerings with a course sheet in the academic year current at retrieval, switching in August,
 * the one year the API answers for at a time. The records state no year of their own, so the sink dates them with the
 * same year. A response the API does not report as a success yields no drafts at all, so the
 * run retracts nothing on the strength of it and fails on the retraction floor instead.
 *
 * @returns A promise resolving to a tally of what the run did
 */
export async function Coimbra() {

	const vault = service(createVault);

	const request = new Request(`${await vault(DataURL)}/obtemCursosBloco`, {

		method: "POST",

		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
			"Accept": "application/json"
		},

		body: new URLSearchParams({
			applicationId: await vault(DataId),
			accessToken: await vault(DataToken),
			obterInformacaoFichaCurso: "true",
			devolverSoCursosComFichaCurso: "true",
			anoLectivo: getAcademicYear(new Date())
		})

	});

	return pipe(
		(items([request]))
		(fetch())
		(flat(map(async response => {

			const { status, listaResultados }: Results = await response.json();

			if ( status === "SUCCESS" && listaResultados ) {

				return listaResultados;

			} else {

				logger.error`unexpected response with status <${status}>`;

				return [];

			}

		})))
		(flat(map(read)))
		(sync(Source))
	);

}


function read(record: OfferingRecord): readonly Draft[] {

	const draft = offering(record);

	if ( draft === undefined ) {

		logger.warning`malformed record <${clip(JSON.stringify(record), 100)}>`;

		return [];

	} else {

		return [draft];

	}

}
