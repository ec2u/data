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

import { opt } from "@metreeca/core";
import { by, compound, locale } from "@metreeca/core/order";


/**
 * A SKOS concept as listed by the concept widgets.
 */
export type SKOSEntry = {

	readonly id: string

	readonly notation?: string
	readonly prefLabel: string

}


/**
 * Resolves the label a concept is shown with.
 *
 * @param concept The concept to be labelled
 *
 * @returns The preferred label of `concept`, led by its notation if it has one (`011 - Education science`)
 */
export function getSKOSLabel({ notation, prefLabel }: SKOSEntry): string {
	return notation === undefined ? prefLabel : `${notation} - ${prefLabel}`;
}

/**
 * Orders concepts for display.
 *
 * Concepts are ordered by notation, comparing the digits they hold as numbers, and then by preferred label.
 */
export const SKOSOrder = compound<SKOSEntry>(
	by(({ notation }) => notation, locale(undefined, { numeric: true })),
	by(getSKOSLabel, locale())
);

/**
 * Orders the broader concepts of a concept from the root of the hierarchy down.
 *
 * @param concepts The broader concepts, each stating its own direct broader concepts
 *
 * @returns A copy of `concepts` where every concept follows those it is narrower than, siblings in display order
 */
export function getSKOSLineage<T extends SKOSEntry & { readonly broader?: readonly string[] }>(
	concepts: readonly T[]
): readonly T[] {

	const index = new Map(concepts.map(concept => [concept.id, concept]));

	return [...concepts].sort(compound<T>(
		by(concept => depth(concept, [])),
		SKOSOrder
	));


	/**
	 * Measures how many concepts of the set lie above a concept, ignoring links that close a cycle.
	 */
	function depth({ id, broader = [] }: T, trail: readonly string[]): number {
		return Math.max(0, ...broader
			.filter(parent => parent !== id && !trail.includes(parent))
			.flatMap(parent => opt(index.get(parent), concept => [concept]) ?? []) // concepts outside the set are skipped
			.map(concept => 1+depth(concept, [...trail, id]))
		);
	}

}
