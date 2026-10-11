/*
 * Copyright © 2026 Metreeca srl. All rights reserved.
 */

/**
 * Shape model operations.
 *
 * Collects the {@link resource!ResourceShape | resource shapes} making up a data model, so that model-wide encodings,
 * such as vocabularies, schemas and documentation, cover every shape a set of entry shapes depends on rather than
 * only the entry shapes themselves.
 *
 * **Collecting a model**
 *
 * Pass the entry shapes to {@link model}: the result lists them together with the shapes they extend, link to or
 * embed, each once, in a stable order:
 *
 * ```typescript
 * import { model } from '@metreeca/blue/model';
 * import { id, optional, resource } from '@metreeca/blue/resource';
 * import { reference } from '@metreeca/blue/reference';
 *
 * const Vendor = resource({
 *   id: id()
 * });
 *
 * const Product = resource({
 *   id: id(),
 *   vendor: optional(reference(Vendor))
 * });
 *
 * model(Product); // [Product, Vendor]
 * ```
 *
 * @module
 *
 * @see {@link https://www.w3.org/TR/shacl/#shapes-graph SHACL § 3.1 Shapes Graph}
 */

import { getShapeTarget } from "@metreeca/blue/reference";
import type { ResourceShape } from "@metreeca/blue/resource";
import { eager, type Shape } from "@metreeca/blue/value";
import { type Lazy, opt } from "@metreeca/core";
import { type Some, some } from "@metreeca/core/arrays";


/**
 * Collects the resource shapes reachable from a set of shapes.
 *
 * A shape reaches the shapes it extends and the shapes its properties link to or embed, including the targets of
 * {@link resource!PropertyConstraints.foreign | foreign} properties and the alternatives of
 * {@link union!union | unions}. Reachability is transitive.
 *
 * Shapes are listed in breadth-first order, each one once, even if shapes link to each other in a cycle. The entry
 * shapes form the first layer, in the order given; each later layer lists the shapes first reached from the previous
 * one, in the order the previous layer reaches them: parents before property targets, and properties in declaration
 * order.
 *
 * @param shapes The resource shape or shapes the traversal starts from, possibly deferred
 *
 * @returns The shapes reachable from `shapes`, `shapes` included; empty if `shapes` is empty
 */
export function model(shapes: Some<Lazy<ResourceShape>>): readonly ResourceShape[] {

	return reachable(some(shapes).map(eager), []);


	function reachable(pending: readonly ResourceShape[], visited: readonly ResourceShape[]): readonly ResourceShape[] {

		const [head, ...tail] = pending;

		return head === undefined ? visited
			: visited.includes(head) ? reachable(tail, visited)
				: reachable([...tail, ...neighbours(head)], [...visited, head]);

	}

	function neighbours({ parents, members }: ResourceShape): readonly ResourceShape[] {

		return [
			...parents.map(eager),
			...Object.values(members).flatMap(member => member.kind === "property" ? targets(member.range.shape) : [])
		];

	}

	function targets(shape: Lazy<Shape>): readonly ResourceShape[] {

		const resolved = eager(shape);

		return resolved.kind === "union"
			? resolved.branches.flatMap(targets)
			: opt(getShapeTarget(resolved), target => [target], []);

	}

}
