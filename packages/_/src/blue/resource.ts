/*
 * Copyright © 2026 Metreeca srl. All rights reserved.
 */

import { getShapeId, getShapeProperties, type Property, type ResourceShape } from "@metreeca/blue/resource";
import { getShapeBranches, getStateBranch, type UnionShape } from "@metreeca/blue/union";
import { type Shape, type State } from "@metreeca/blue/value";
import { type Identifier, type Lazy, opt, type Optional } from "@metreeca/core";
import { some } from "@metreeca/core/arrays";
import { type Reference } from "@metreeca/qest/state";


/**
 * One value a validated state holds, paired with the member holding it and the value shape it matches.
 *
 * Narrowing an entry on `kind` narrows `shape` and `value` together: `value` is typed as the
 * {@link @metreeca/blue/value!State | state} of `shape`. Union values are resolved to the branch they match, so no
 * entry has kind `union`.
 *
 * @typeParam S The value shapes an entry may match; defaults to every shape except unions
 */
export type Entry<S extends Shape = Exclude<Shape, UnionShape>> = S extends Shape ? {

	readonly kind: S["kind"];

	readonly field: Identifier;
	readonly property: Property;

	readonly shape: S;
	readonly value: State<S>;

} : never;


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Retrieves the identifier of a validated state.
 *
 * @typeParam S The resource shape `state` conforms to
 *
 * @param shape The resource shape driving the walk
 * @param state The validated state to read
 *
 * @returns The identifier `state` states, or `undefined` where `shape` declares no id member or `state` states none
 */
export function getStateId<S extends Lazy<ResourceShape>>(shape: S, state: State<S>): Optional<Reference> {

	return opt(getShapeId(shape), id => state[id] as Optional<Reference>);

}

/**
 * Retrieves the values of a validated state.
 *
 * Each value is paired with the member holding it and the value shape it matches. Entries follow member declaration
 * order, then value order within each member. Undeclared members are skipped, as are the id and type members.
 *
 * @typeParam S The resource shape `state` conforms to
 *
 * @param shape The resource shape driving the walk
 * @param state The validated state to walk
 *
 * @returns One entry for each value `state` holds under a property `shape` declares
 */
export function getStateEntries<S extends Lazy<ResourceShape>>(shape: S, state: State<S>): readonly Entry[] {

	// ;(cast) getStateBranch validates `value` against `branch`, so it is the state of that non-union branch

	// !!! drop once getStateBranch returns the matched branch paired with the value typed as its state (see resource.md)

	return Object.entries(getShapeProperties(shape)).flatMap(([field, property]) => property.kind === "property"
		? some(state[field]).flatMap(value => opt(
			getStateBranch(value, getShapeBranches(property.range.shape)),
			branch => [{ kind: branch.kind, field, property, shape: branch, value } as Entry],
			[]
		))
		: []
	);

}
