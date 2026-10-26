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
import { by, compound, descending, locale } from "@metreeca/core/order";


/**
 * The facets a taxonomy listing is narrowed by.
 */
export type Facet = "license" | "publisher";

/**
 * The filters narrowing a taxonomy listing.
 */
export type Filters = {

	/**
	 * The keywords taxonomy labels are matched against; no keyword filter if empty.
	 */
	readonly keywords: string

	/**
	 * The values selected for each facet; a taxonomy is listed if it carries any of them, or if none is selected.
	 */
	readonly facets: { readonly [facet in Facet]: readonly string[] }

};

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
 * A value a facet takes, with the number of taxonomies carrying it.
 */
export type FacetRow = {

	readonly value: string
	readonly count: number

};

/**
 * A facet value as offered to the reader for selection.
 */
export type FacetOption = FacetRow & {

	readonly selected: boolean

};


/**
 * The filters in force before the reader narrows the listing.
 */
export const NoFilters: Filters = {
	keywords: "",
	facets: { license: [], publisher: [] }
};


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Checks if any filter narrows a listing.
 */
export function isFiltered({ keywords, facets }: Filters): boolean {
	return keywords !== "" || Object.values(facets).some(values => values.length > 0);
}

/**
 * Updates the selection of a facet value.
 *
 * @returns A copy of `filters` with `value` added to or removed from the selection of `facet`
 */
export function select(filters: Filters, facet: Facet, value: string, selected: boolean): Filters {
	return {
		...filters, facets: {
			...filters.facets, [facet]: selected
				? [...filters.facets[facet].filter(item => item !== value), value]
				: filters.facets[facet].filter(item => item !== value)
		}
	};
}

/**
 * Resolves the criteria a filter set imposes on a taxonomy collection.
 *
 * @param filters The filters in force
 * @param facet The facet left unconstrained, so its own values are counted under the other filters alone
 *
 * @returns The collection criteria matching labels against the keywords and facet values against their selection
 */
export function getCriteria({ keywords, facets }: Filters, facet?: Facet) {
	return {

		...(keywords !== "" ? { "~label": keywords } : {}),

		...(facet !== "license" && facets.license.length > 0 ? { "?license": facets.license } : {}),
		...(facet !== "publisher" && facets.publisher.length > 0 ? { "?publisher": facets.publisher } : {})

	};
}


/**
 * Merges the values a facet takes with the selection in force.
 *
 * Selected values the other filters leave no taxonomy for are kept with a zero count, so the reader can still clear
 * them. Values are listed by decreasing count, and then alphabetically among values sharing a count.
 *
 * @returns The facet options, each flagged as selected or not
 */
export function getOptions(rows: readonly FacetRow[], selection: readonly string[]): readonly FacetOption[] {
	return [

		...rows,

		...selection
			.filter(value => !rows.some(row => row.value === value))
			.map(value => ({ value, count: 0 }))

	]
		.map(row => ({ ...row, selected: selection.includes(row.value) }))
		.sort(compound(by(({ count }) => count, descending), by(({ value }) => value, locale())));
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Checks if a projected row describes a taxonomy.
 *
 * Projected rows come back from the store untyped (metreeca/keep#15), so the cells are checked here before they are
 * read; rows failing the check are left out of the taxonomy listing and of its count.
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

/**
 * Checks if a projected row describes a facet value.
 *
 * Rows for taxonomies lacking a value for the facet carry no value cell and are left out of the options.
 */
export function isFacetRow(value: unknown): value is FacetRow {
	return isObject(value, {
		value: isString,
		count: isNumber
	});
}

/**
 * Checks if a projected row holds a count.
 */
export function isCountRow(value: unknown): value is { readonly count: number } {
	return isObject(value, {
		count: isNumber
	});
}
