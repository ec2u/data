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

import { model } from "@metreeca/blue";
import type { ResourceShape } from "@metreeca/blue/resource";
import { eager } from "@metreeca/blue/value";
import { type Lazy, opt, type Optional } from "@metreeca/core";
import { some, type Some } from "@metreeca/core/arrays";
import { by, locale } from "@metreeca/core/order";
import { getShapeHref, getShapeId, getShapeName } from "./shape/index.js";


/**
 * A documented shape of the data model.
 */
export type Model = {

	/**
	 * The location of the page documenting the shape, as returned by {@link getShapeHref}.
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
 * Covers the entry shapes and every shape they depend on, as collected by {@link @metreeca/blue!model model}.
 *
 * @param universe The entry shapes of the model, possibly deferred
 *
 * @returns The shapes of the model, each with the location of its page, sorted by name; shapes with no page
 *     located by {@link getShapeHref}, as outside the model the hub serves, are left out
 */
export function getModels(universe: Some<Lazy<ResourceShape>>): readonly Model[] {

	return model(universe)
		.flatMap(shape => opt(getShapeHref(shape), href => [{ href, shape }]) ?? [])
		.sort(by(({ shape }) => getShapeName(shape), locale())); // fresh array from flatMap

}

/**
 * Lists the documented entry shapes of a model.
 *
 * @param universe The entry shapes of the model, possibly deferred
 *
 * @returns The documented entry shapes, each with the location of its page, in the order given
 */
export function getModelEntries(universe: Some<Lazy<ResourceShape>>): readonly Model[] {
	return some(universe).flatMap(lazy => {

		const shape = eager(lazy);

		return opt(getShapeHref(shape), href => [{ href, shape }]) ?? [];

	});
}

/**
 * Arranges the documented shapes of a model by inheritance, leaving out the entry shapes.
 *
 * Roots are the documented shapes extending no documented shape; each shape is nested under every documented shape it
 * extends, directly or through undocumented ones, so a shape with several documented parents is listed under each.
 * Entry shapes are listed apart by {@link getModelEntries}.
 *
 * @param universe The entry shapes of the model, possibly deferred
 *
 * @returns The roots of the inheritance hierarchy of the documented shapes other than entries, each node and its
 *     children sorted by name
 */
export function getModelTree(universe: Some<Lazy<ResourceShape>>): readonly ModelNode[] {

	const models = getModels(universe);
	const hrefs = new Set(models.map(({ href }) => href));

	const entries = getModelEntries(universe).map(({ href }) => href);

	const parents = new Map(models.map(({ href, shape }) => [href, ancestors(shape).filter(parent =>
		hrefs.has(parent)
	)]));

	return nodes(href => !entries.includes(href) && parents.get(href)?.length === 0);


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
 * Retrieves a documented shape of a model by its identifier.
 *
 * @param universe The entry shapes of the model, possibly deferred
 * @param id The {@link getShapeId | identifier} of the shape to be retrieved
 *
 * @returns The shape of the model identified by `id`; none if no shape is identified by `id`
 */
export function getModel(universe: Some<Lazy<ResourceShape>>, id: string): Optional<ResourceShape> {
	return model(universe).find(shape => getShapeId(shape) === id);
}
