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

import { isNumber, isObject, isOptional, isString } from "@metreeca/core";


/**
 * A taxonomy listed with the number of topics it defines.
 */
export type TaxonomyRow = {

	readonly taxonomy: {
		readonly id: string
		readonly label: string
		readonly title: string
		readonly alternative?: string
		readonly description: string
	}

	readonly size: number

};


/**
 * Checks if a projected row describes a taxonomy.
 *
 * @param value The row to be checked
 *
 * @returns `true` if `value` holds a taxonomy and its size; `false` otherwise
 */
export function isTaxonomyRow(value: unknown): value is TaxonomyRow {
	return isObject(value, {

		taxonomy: taxonomy => isObject(taxonomy, {
			id: isString,
			label: isString,
			title: isString,
			alternative: alternative => isOptional(alternative, isString),
			description: isString
		}),

		size: isNumber

	});
}
