/*
 * Copyright © 2026 Metreeca srl
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

import type { ResourceShape } from "@metreeca/blue/resource";
import { eager } from "@metreeca/blue/value";
import { type Lazy, opt, type Optional } from "@metreeca/core";
import type { Lexicon } from "@metreeca/core/resource";
import { equals } from "@metreeca/core/values";
import type { Endpoints } from "./endpoints.core.js";
import { described, type ShapeMember, type ShapeType } from "./index.core.js";
import { documented, linked, nameShape, type ShapeLink, shown, summarize } from "./shapes.core.js";


/**
 * The TypeScript interface describing the resources of a shape.
 */
export type ShapeInterface = {

	/**
	 * The name of the interface: the {@link nameShape | name} of the shape, stripped of the characters not allowed
	 * in TypeScript identifiers.
	 */
	readonly name: string

	/**
	 * The interfaces extended by the interface, one for each nearest documented ancestor of the shape, linked to its
	 * documentation.
	 */
	readonly parents: readonly ShapeLink[]

	/**
	 * The members of the interface, in declaration order: the ones the shape declares in its own right, including the
	 * identifier and the class of its resources, and the inherited ones it narrows.
	 */
	readonly members: readonly ShapeSignature[]

};

/**
 * A member of the TypeScript interface describing the resources of a shape: a property, or the member carrying the
 * identifier or the class of the resource. Its types are the TypeScript types of its values other than localised text,
 * one for each distinct alternative: the interfaces of linked or embedded resources, or `string`, `number` and
 * `boolean` for plain values, so that the identifier and the class of the resource are typed as `string`.
 */
export type ShapeSignature = ShapeMember & {

	/**
	 * Whether the member admits no value.
	 */
	readonly optional: boolean

	/**
	 * Whether the member admits more than one value for its types, typed as an array; localised text is never arrayed,
	 * being carried as a whole map whatever bounds the member states.
	 */
	readonly plural: boolean

	/**
	 * The localised text the member admits as an alternative, with the restrictions it states, whether each language
	 * carries a single string among them; none if the member admits no localised text.
	 */
	readonly dictionary: Optional<ShapeType>

	/**
	 * The first paragraph of the description of the member, with whitespace collapsed; none if not stated.
	 */
	readonly summary: Optional<string>

};


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Describes a resource shape as a TypeScript interface.
 *
 * States the interface extending the nearest documented ancestors of `lazy`, with the members it declares in its own
 * right and the inherited ones it narrows, stating their types, restrictions, bounds or flags differently from at
 * least one ancestor declaring them.
 *
 * @param endpoints The routes served by the API, each mapped to the shape of the resources it serves
 * @param lexicon The prefixes abbreviating the IRIs of the model
 * @param lazy The shape to be described, possibly deferred
 *
 * @returns The TypeScript interface describing the resources of `lazy`
 */
export function getShapeInterface(endpoints: Endpoints, lexicon: Lexicon, lazy: Lazy<ResourceShape>): ShapeInterface {

	const shape = eager(lazy);
	const ancestors = documented(endpoints, lexicon, shape);

	return {

		name: identifier(nameShape(shape, lexicon)),
		parents: ancestors.map(ancestor => scriptable(endpoints, lexicon, ancestor)),

		members: Object.keys(shape.members).flatMap(term => {

			const signature = opt(shown(shape, term), member => signed(described(endpoints, lexicon, shape, term, member)));

			const inherited = ancestors.flatMap(ancestor => opt(shown(ancestor, term), member =>
				[signed(described(endpoints, lexicon, ancestor, term, member))]
			) ?? []);

			return signature !== undefined && (inherited.length === 0 || inherited.some(ancestor =>
				!equals(spelled(ancestor), spelled(signature))
			)) ? [signature] : [];

		})

	};

}

/**
 * Links a resource shape to its documentation under its TypeScript identifier.
 */
export function scriptable(endpoints: Endpoints, lexicon: Lexicon, shape: ResourceShape): ShapeLink {

	const link = linked(endpoints, lexicon, shape);

	return { ...link, name: identifier(link.name) };

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Describes a member of a shape as a member of a TypeScript interface.
 */
function signed(member: ShapeMember): ShapeSignature {

	const { types, minCount, maxCount, description } = member;

	const scripts = scripted(types);

	return {
		...member,
		types: scripts,
		dictionary: types.find(({ kind }) => kind === "dictionary"),
		optional: minCount === 0,
		plural: scripts.length > 0 && (maxCount === undefined || maxCount > 1),
		summary: opt(description, summarize)
	};

}

/**
 * Retrieves what a member of a TypeScript interface states about its values, for comparison: their types and the
 * restrictions on them, their number, and the flags on the member, leaving out how it is labelled and described.
 */
function spelled({
	optional, plural, minCount, maxCount, types, dictionary, managed, foreign, captive
}: ShapeSignature): Readonly<Record<string, unknown>> {
	return { optional, plural, minCount, maxCount, types, dictionary, managed, foreign, captive };
}

/**
 * Lists the TypeScript types standing for the types of a member other than localised text, one for each distinct
 * alternative with the restrictions it states, keeping the links of shapes to their documentation.
 */
function scripted(types: readonly ShapeType[]): readonly ShapeType[] {

	const scripts = types.filter(({ kind }) => kind !== "dictionary").map(type => type.kind === "resource"
		? { ...type, name: identifier(type.name) }
		: { ...type, name: type.kind, href: undefined }
	);

	return scripts.filter((type, index) => scripts.findIndex(other => equals(other, type)) === index);

}

/**
 * Converts the name of a resource shape into a TypeScript identifier.
 */
function identifier(name: string): string {
	return name.replace(/[^\p{L}\p{N}_$]/gu, "");
}
