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
import { isText, type Text } from "../../index.core.js";


/**
 * A dataset published on the hub, with the number of resources it holds.
 */
export type DatasetRow = {

	readonly dataset: {
		readonly id: string
		readonly title: Text
		readonly alternative?: Text
		readonly description?: Text
	}

	readonly size: number

};


/**
 * Checks if a projected row describes a dataset.
 *
 * Projected rows come back from the store untyped (metreeca/keep#15), so rows lacking a dataset cell or a size are
 * told apart here and left out of the dataset listing on the home page of the knowledge hub.
 *
 * @param value The row to be checked
 *
 * @returns `true` if `value` holds a dataset and its size; `false` otherwise
 */
export function isDatasetRow(value: unknown): value is DatasetRow {
	return isObject(value, {

		dataset: dataset => isObject(dataset, {
			id: isString,
			title: isText,
			alternative: alternative => isOptional(alternative, isText),
			description: description => isOptional(description, isText)
		}),

		size: isNumber

	});
}
