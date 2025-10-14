/*
 * Copyright © 2025 Metreeca srl
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

import { secret } from "@/utilities/gcp/secrets";
import SparqlClient from "sparql-http-client";

export const base="https://data.ec2u.eu/";

export const units=`${base}units/`;

export const universities=`${base}universities/`;


export const coimbra=`${universities}coimbra`;
export const iasi=`${universities}iasi`;
export const jena=`${universities}jena`;
export const linz=`${universities}linz`;
export const pavia=`${universities}pavia`;
export const poitiers=`${universities}poitiers`;
export const salamanca=`${universities}salamanca`;
export const turku=`${universities}turku`;
export const umea=`${universities}umea`;


export const hub=new SparqlClient({
	endpointUrl: "https://graphdb.ec2u.net/repositories/data-main",
	user: await secret("gdb-server-usr"),
	password: await secret("gdb-server-pwd")
});
