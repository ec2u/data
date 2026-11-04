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

import { Datasets } from "@ec2u/data-shared";
import { Courses } from "@ec2u/data-shared/courses/index.js";
import { Documents } from "@ec2u/data-shared/documents/index.js";
import { Events } from "@ec2u/data-shared/events/index.js";
import { Programs } from "@ec2u/data-shared/programs/index.js";
import { Taxonomies } from "@ec2u/data-shared/taxonomies/index.js";
import { Units } from "@ec2u/data-shared/units/index.js";
import { Universities } from "@ec2u/data-shared/universities/index.js";
import { model } from "@metreeca/blue";
import type { ResourceShape } from "@metreeca/blue/resource";
import { eager } from "@metreeca/blue/value";
import { type Lazy, opt, type Optional } from "@metreeca/core";
import { some, type Some } from "@metreeca/core/arrays";
import { by, locale } from "@metreeca/core/order";
import { getShapeHref, getShapeKey, getShapeName } from "../../tiles/shape.core.js";


/**
 * The entry shapes of the model the hub serves: the catalogue of each dataset, from which every other documented
 * shape is reached.
 */
export const universe: Some<Lazy<ResourceShape>> = [
	Datasets,
	Universities,
	Units,
	Programs,
	Courses,
	Documents,
	Events,
	Taxonomies
];


/**
 * A documented shape of the data model.
 */
export type Model = {

	/**
	 * The root-relative location of the page documenting the shape, as returned by {@link getShapeHref}.
	 */
	readonly href: string

	/**
	 * The documented shape.
	 */
	readonly shape: ResourceShape

};

/**
 * A documented shape placed in the inheritance hierarchy of the data model.
 */
export type ModelNode = {

	/**
	 * The documented shape.
	 */
	readonly model: Model

	/**
	 * The documented shapes extending the shape, directly or through undocumented ones, sorted by name.
	 */
	readonly children: readonly ModelNode[]

};


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Lists the documented shapes of a model.
 *
 * Covers the entry shapes and every shape they depend on, as collected by {@link @metreeca/blue!model model}, leaving
 * out the shapes with no {@link getShapeKey | key}, which have no page of their own.
 *
 * @param universe The entry shapes of the model, possibly deferred
 *
 * @returns The keyed shapes of the model, each with the location of its page, sorted by name; where several shapes
 *     share a page, only the first in model order is listed
 */
export function getModels(universe: Some<Lazy<ResourceShape>>): readonly Model[] {

	return model(universe)
		.flatMap(shape => opt(getShapeHref(shape), href => [{ href, shape }]) ?? [])
		.filter(({ href }, index, models) => models.findIndex(model => model.href === href) === index)
		.sort(by(({ shape }) => getShapeName(shape), locale())); // fresh array from filter

}

/**
 * Arranges the documented shapes of a model by inheritance.
 *
 * The documented entry shapes come first, in the order given, followed by the other documented shapes extending no
 * documented shape; each shape other than an entry is nested under every documented shape it extends, directly or
 * through undocumented ones, so a shape with several documented parents is listed under each.
 *
 * @param universe The entry shapes of the model, possibly deferred
 *
 * @returns The roots of the inheritance hierarchy of the documented shapes, entries first; other roots and the
 *     children of each node sorted by name
 */
export function getModelTree(universe: Some<Lazy<ResourceShape>>): readonly ModelNode[] {

	const models = getModels(universe);
	const hrefs = new Set(models.map(({ href }) => href));

	const entries = some(universe).flatMap(entry => opt(getShapeHref(entry), href => [href]) ?? []);

	const parents = new Map(models.map(({ href, shape }) => [href, ancestors(shape).filter(parent =>
		hrefs.has(parent) && parent !== href // !!! a parent sharing the page of its child is an artefact of stub keys
	)]));

	return [
		...entries.flatMap(entry => nodes(href => href === entry)),
		...nodes(href => !entries.includes(href) && parents.get(href)?.length === 0)
	];


	function nodes(selected: (href: string) => boolean): readonly ModelNode[] {
		return models.filter(({ href }) => selected(href)).map(model => ({
			model,
			children: nodes(href => !entries.includes(href) && (parents.get(href)?.includes(model.href) ?? false))
		}));
	}

}

/**
 * Lists the pages of the nearest documented shapes a shape extends, looking through undocumented ones.
 */
function ancestors(shape: ResourceShape): readonly string[] {
	return [...new Set(shape.parents.flatMap(lazy => {

		const parent = eager(lazy);

		return opt(getShapeHref(parent), href => [href]) ?? ancestors(parent);

	}))];
}

/**
 * Retrieves a documented shape of a model by its key.
 *
 * @param universe The entry shapes of the model, possibly deferred
 * @param key The {@link getShapeKey | key} of the shape to be retrieved
 *
 * @returns The first shape of the model keyed by `key`, in model order; none if no shape is keyed by `key`
 */
export function getModel(universe: Some<Lazy<ResourceShape>>, key: string): Optional<ResourceShape> {
	return model(universe).find(shape => getShapeKey(shape) === key);
}
