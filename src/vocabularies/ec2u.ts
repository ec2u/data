/*
 * Copyright © 2025-2026 Metreeca srl
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

import { ec2u as ec2u1 } from "@/index.js";
import { decimal } from "@metreeca/blue/number";
import { property, resource } from "@metreeca/blue/resource";
import { markdown, plain } from "@metreeca/blue/string";
import { optional, required, type State } from "@metreeca/blue/value";
import { createNamespace } from "@metreeca/core/resource";


export const ec2u = createNamespace(`${ec2u1}/terms#`, [

	"dataset",
	"resource",

	"university"

]);

export const rdfs = createNamespace("http://www.w3.org/2000/01/rdf-schema#", [

	"label",
	"comment",

	"member"

]);

export const wgs = createNamespace("http://www.w3.org/2003/01/geo/wgs84_pos#", [

	"long",
	"lat"

]);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export type Entity = State<typeof Entity>
export type GeoEntity = State<typeof GeoEntity>


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function Entity() {
	return resource({

		namespace: rdfs

	}, {

		label: required(plain({
			maxLength: 100
		})),

		comment: optional(markdown({
			maxLength: 500
		}))

	});
}

export function GeoEntity() {
	return resource({

		extends: Entity,
		namespace: wgs

	}, {

		longitude: property({ forward: wgs.long }, required(decimal({
			minInclusive: -180,
			maxInclusive: 180
		}))),

		latitude: property({ forward: wgs.lat }, required(decimal({
			minInclusive: -90,
			maxInclusive: 90
		})))

	});
}
