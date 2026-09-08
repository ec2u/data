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
import { immutable } from "@metreeca/core/structures";


export const coimbra = immutable({
	id: `${ec2u}/universities/coimbra`,
	locale: "pt",
	zone: "Europe/Lisbon"
});

export const iasi = immutable({
	id: `${ec2u}/universities/iasi`,
	locale: "ro",
	zone: "Europe/Bucharest"
});

export const jena = immutable({
	id: `${ec2u}/universities/jena`,
	locale: "de",
	zone: "Europe/Berlin"
});

export const linz = immutable({
	id: `${ec2u}/universities/linz`,
	locale: "de",
	zone: "Europe/Vienna"
});

export const pavia = immutable({
	id: `${ec2u}/universities/pavia`,
	locale: "it",
	zone: "Europe/Rome"
});

export const poitiers = immutable({
	id: `${ec2u}/universities/poitiers`,
	locale: "fr",
	zone: "Europe/Paris"
});

export const salamanca = immutable({
	id: `${ec2u}/universities/salamanca`,
	locale: "es",
	zone: "Europe/Madrid"
});

export const turku = immutable({
	id: `${ec2u}/universities/turku`,
	locale: "fi",
	zone: "Europe/Helsinki"
});

export const umea = immutable({
	id: `${ec2u}/universities/umea`,
	locale: "sv",
	zone: "Europe/Stockholm"
});
