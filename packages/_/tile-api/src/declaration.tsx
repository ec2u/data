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

import type { ResourceShape } from "@grafctory/blue/resource";
import { eager } from "@grafctory/blue/value";
import { Link } from "@grafctory/clay-widgets/link";
import { opt, type Optional } from "@grafctory/core";
import type { Lexicon } from "@grafctory/core/resource";
import { type ComponentChildren, Fragment } from "preact";
import { getShapeInterface, type ShapeSignature } from "./declaration.core.js";
import type { Endpoints } from "./endpoints.core.js";
import { bounded, Code, constrain, Keyword } from "./index.core.js";
import { getShape, getShapeChecks, getShapeSummary, prefixed, type ShapeLink } from "./shapes.core.js";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates the TypeScript interface describing the resources of a shape.
 *
 * Sets out the interface as a code block, with the members listed by {@link getShapeInterface}. The interfaces it
 * extends and the types of its members link to the documentation of their shapes.
 *
 * The interface comment states the class of the shape, linked to its definition, its summary and its custom checks.
 * Each member comment states its label, its predicates and its summary, then the bounds and constraints its type
 * cannot convey. Predicates link to their definitions, an inverse one prefixed by `^`. Unstated parts are left out.
 *
 * Sets out nothing if no shape of the model carries the given identifier.
 *
 * @param options The widget configuration
 *
 * @returns The interface declaration
 */
export function ShapeDeclaration({

	id,
	endpoints,
	lexicon

}: {

	/**
	 * The identifier of the shape to be described, as the last step of the route of its documentation page.
	 */
	id: string

	/**
	 * The routes served by the API, each mapped to the shape of the resources it serves.
	 */
	endpoints: Endpoints

	/**
	 * The prefixes abbreviating the IRIs of the model.
	 */
	lexicon: Lexicon

}) {
	return opt(getShape(endpoints, lexicon, id), shape =>
		<Declaration endpoints={endpoints} lexicon={lexicon} shape={shape}/>
	) ?? null;
}

/**
 * Sets out the TypeScript interface of a shape of the model.
 */
function Declaration({

	endpoints,
	lexicon,
	shape

}: {

	/**
	 * The routes served by the API, each mapped to the shape of the resources it serves.
	 */
	endpoints: Endpoints

	/**
	 * The prefixes abbreviating the IRIs of the model.
	 */
	lexicon: Lexicon

	/**
	 * The shape to be described.
	 */
	shape: ResourceShape

}) {

	const { name, parents, members } = getShapeInterface(endpoints, lexicon, shape);
	const checks = getShapeChecks(shape);

	return <Code>

		<Comment blocks={[
			opt(eager(shape).class, type => [<Link href={type}>{prefixed(lexicon, type)}</Link>]),
			opt(getShapeSummary(shape), wrap),
			checks.length > 0 ? [`checks: ${checks.join(", ")}`] : undefined
		]}/>

		<Keyword>interface</Keyword> {name}
		{parents.length > 0 && <> <Keyword>extends</Keyword> <Joined links={parents} separator={", "}/></>}
		{" {\n"}

		{members.length > 0 && <>{"\n"}{members.map((member, index) => <Fragment key={member.term}>
			{index > 0 && "\n"}
			<Member lexicon={lexicon} {...member}/>
		</Fragment>)}{"\n"}</>}

		{"}"}

	</Code>;

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Sets out a member of an interface under its doc comment: label, predicates, summary, then bounds and constraints.
 */
function Member({ lexicon, ...member }: ShapeSignature & { lexicon: Lexicon }) {

	const {
		term, optional, plural, minCount, maxCount, types, dictionary, label, predicate, reverse, summary
	} = member;

	const counted = types.length > 0 && (minCount > 1 || maxCount !== undefined && maxCount > 1);
	const lines = [
		...(counted ? [`count: ${bounded(minCount, maxCount)}`] : []),
		...constrain(lexicon, { ...member, types: [...types, ...opt(dictionary, dictionary => [dictionary]) ?? []] })
			.map(({ label, values }) => `${label}: ${values.join(", ")}`)
	];

	return <>
		<Comment indent={"\t"} blocks={[
			opt(label, label => [label]),
			predicate === undefined && reverse === undefined ? undefined : [
				...opt(predicate, iri => [<Link href={iri}>{prefixed(lexicon, iri)}</Link>]) ?? [],
				...opt(reverse, iri => [<>^<Link href={iri}>{prefixed(lexicon, iri)}</Link></>]) ?? []
			],
			opt(summary, wrap),
			lines.length > 0 ? lines : undefined
		]}/>
		{"\t"}<Keyword>readonly</Keyword> {term}{optional ? "?" : ""}: {opt(dictionary, ({ restrictions }) =>
		`{ readonly [tag: string]: ${restrictions.uniqueLang ? "string" : "readonly string[]"} }`
	)}
		{dictionary !== undefined && types.length > 0 && " | "}
		{types.length > 0 && <>
			{plural && <><Keyword>readonly</Keyword> </>}
			{plural && types.length > 1 && "("}<Joined links={types} separator={" | "}/>{plural && types.length > 1 && ")"}
			{plural && "[]"}
        </>}{"\n"}
	</>;

}

/**
 * Sets out an indented doc comment of a code block, its blocks of lines separated by empty lines; nothing if all are
 * missing, so that a member or an interface stating neither predicate, class nor summary is left uncommented.
 */
function Comment({ indent = "", blocks }: {
	indent?: string
	blocks: readonly Optional<readonly ComponentChildren[]>[]
}) {

	const stated = blocks.filter(block => block !== undefined);

	return stated.length > 0 ? <span class={"tile-api-shape-comment"}>
		{`${indent}/**\n`}
		{stated.map((lines, index) => <Fragment key={index}>
			{index > 0 && `${indent} *\n`}
			{lines.map((line, key) => <Fragment key={key}>{`${indent} * `}{line}{"\n"}</Fragment>)}
		</Fragment>)}
		{`${indent} */\n`}
	</span> : undefined;

}

/**
 * Sets out a list of types inline, joined by a separator, each linked to its documentation where located.
 */
function Joined({ links, separator }: { links: readonly ShapeLink[], separator: string }) {
	return <>{links.map(({ name, href }, index) => <Fragment key={index}>
		{index > 0 && separator}{href === undefined ? name : <Link href={href}>{name}</Link>}
	</Fragment>)}</>;
}

/**
 * Breaks a text into lines short enough to keep a doc comment within the width of a code block.
 */
function wrap(text: string): readonly string[] {
	return text.match(/\S.{0,99}(?=\s|$)|\S+/g) ?? [];
}
