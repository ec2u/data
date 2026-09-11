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

import { decimal } from "@metreeca/blue/number";
import { property, resource } from "@metreeca/blue/resource";
import { required } from "@metreeca/blue/value";
import { createNamespace } from "@metreeca/core/resource";


export const LatitudeLimit = 90;
export const LongitudeLimit = 180;


export const wgs = createNamespace("http://www.w3.org/2003/01/geo/wgs84_pos#", [

	"long",
	"lat"

]);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function Point() {
	return resource({

		longitude: property({ forward: wgs.long }, required(decimal({
			minInclusive: -LongitudeLimit,
			maxInclusive: LongitudeLimit
		}))),

		latitude: property({ forward: wgs.lat }, required(decimal({
			minInclusive: -LatitudeLimit,
			maxInclusive: LatitudeLimit
		})))

	}, {

		namespace: wgs

	});
}
