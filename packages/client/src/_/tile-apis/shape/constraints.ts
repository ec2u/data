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

import { isString, opt, type Optional } from "@metreeca/core";
import { equals } from "@metreeca/core/values";
import { prefixed, type ShapeRestrictions, type ShapeType } from "./index.js";


/**
 * A constraint on the values of a member, as labelled and spelled out for reading, one entry for each value it lists.
 */
export type Constraint = {

	/**
	 * The name of the constraint, as `pattern` or `languages`.
	 */
	readonly label: string

	/**
	 * The values the constraint states, spelled out for reading; IRIs are abbreviated as prefixed names.
	 */
	readonly values: readonly string[]

};

/**
 * Spells out the constraints a member states: the restrictions of each of its types, stated once where all its types
 * agree on them and prefixed by the type they apply to otherwise, followed by the ones on the member itself.
 */
export function constrain({ types, managed, foreign, captive }: {
	readonly types: readonly ShapeType[]
	readonly managed: boolean
	readonly foreign: boolean
	readonly captive: boolean
}): readonly Constraint[] {

	const restricted = types.flatMap(({ name, restrictions }) => restrict(restrictions).map(constraint => ({
		...constraint, type: name
	})));

	const labels = [...new Set(restricted.map(({ label }) => label))];

	return [

		...labels.map(label => {

			const matching = restricted.filter(constraint => constraint.label === label);
			const [first] = matching;

			return {
				label, values: first !== undefined && matching.every(({ values }) => equals(values, first.values))
					? first.values
					: matching.flatMap(({ type, values }) => values.map(value => `${type}: ${value}`))
			};

		}),

		...(managed ? [{ label: "read-only", values: ["set by the server"] }] : []),
		...(foreign ? [{ label: "read-only", values: ["set by the linked resources"] }] : []),
		...(captive ? [{ label: "lifecycle", values: ["bound"] }] : [])

	];

}

/**
 * Spells out the number of values a member admits: `1`, `0‥1`, `*`, `1‥*`, or `min‥max` for other bounds, with an
 * open upper bound stated as `*` and the bounds joined by a two dot leader (U+2025) set as a single glyph.
 */
export function bounded(min: number, max: Optional<number>): string {
	return min === 1 && max === 1 ? "1"
		: min === 0 && max === 1 ? "0‥1"
			: min === 0 && max === undefined ? "*"
				: `${min}‥${max ?? "*"}`;
}


/**
 * Spells out the restrictions of a type, in a fixed order.
 */
function restrict({
	template, pattern, minLength, maxLength, languageIn, uniqueLang, integral,
	minInclusive, minExclusive, maxInclusive, maxExclusive, in: values, hasValue
}: ShapeRestrictions): readonly Constraint[] {

	const entries: readonly (readonly [string, readonly string[]])[] = [
		["id space", opt(template, template => [template]) ?? []],
		["pattern", opt(pattern, pattern => [pattern]) ?? []],
		["characters", opt(ranged(minLength, maxLength), range => [range]) ?? []],
		["languages", [...listed(languageIn), ...(uniqueLang ? ["one value each"] : [])]],
		["integral", integral ? ["yes"] : []],
		["minimum", opt(minInclusive, value => [`≥ ${value}`]) ?? opt(minExclusive, value => [`> ${value}`]) ?? []],
		["maximum", opt(maxInclusive, value => [`≤ ${value}`]) ?? opt(maxExclusive, value => [`< ${value}`]) ?? []],
		["values", listed(values)],
		["value", listed(hasValue)]
	];

	return entries.flatMap(([label, values]) => values.length === 0 ? [] : [{ label, values }]);

}

/**
 * Spells out a length range, as `1‥64`, `≥ 1` or `≤ 100`; none if neither bound is stated.
 */
function ranged(min: Optional<number>, max: Optional<number>): Optional<string> {
	return min === undefined ? opt(max, value => `≤ ${value}`)
		: max === undefined ? `≥ ${min}`
			: `${min}‥${max}`;
}

/**
 * Spells out each value of a list, abbreviating IRIs as prefixed names; empty if the list is missing.
 */
function listed(values: Optional<readonly (string | number | boolean)[]>): readonly string[] {
	return (values ?? []).map(value => isString(value) ? prefixed(value) : String(value));
}
