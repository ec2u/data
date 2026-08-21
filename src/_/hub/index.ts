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

import { secret } from "@/_/gcp/secrets.js";
import { createHTTPRepository } from "@metreeca/wire-sparql-http";

export const base = "https://data.ec2u.eu/";


export const Universities = `${base}universities/`;
export const Units = `${base}units/`;


export const coimbra = `${Universities}coimbra`;
export const iasi = `${Universities}iasi`;
export const jena = `${Universities}jena`;
export const linz = `${Universities}linz`;
export const pavia = `${Universities}pavia`;
export const poitiers = `${Universities}poitiers`;
export const salamanca = `${Universities}salamanca`;
export const turku = `${Universities}turku`;
export const umea = `${Universities}umea`;


const credentials = Buffer
	.from(`${await secret("gdb-server-usr")}:${await secret("gdb-server-pwd")}`)
	.toString("base64");


export const hub = createHTTPRepository({

	query: "https://graphdb.ec2u.net/repositories/data-next",

	fetch: (input, init) => {

		const headers = new Headers(init?.headers);

		headers.set("Authorization", `Basic ${credentials}`);

		return fetch(input, { ...init, headers });

	}

});
