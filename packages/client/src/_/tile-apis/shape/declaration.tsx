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

import type { ResourceShape } from "@metreeca/blue/resource";
import { eager } from "@metreeca/blue/value";
import { Link } from "@metreeca/clay-widgets/link";
import { type Lazy, opt, type Optional } from "@metreeca/core";
import { type ComponentChildren, Fragment } from "preact";
import { Code, Keyword } from "./code.js";
import { bounded, constrain } from "./constraints.js";
import { getShapeInterface, getShapeSummary, prefixed, type ShapeLink, type ShapeType, tabulate } from "./index.js";


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
 * @param options The widget configuration
 *
 * @returns The interface declaration
 */
export function ShapeDeclaration({

	shape

}: {

	/**
	 * The shape to be described, possibly deferred.
	 */
	shape: Lazy<ResourceShape>

}) {

	const { name, parents, members } = getShapeInterface(shape);
	const { checks } = tabulate(shape);

	return <Code>

		<Comment blocks={[
			opt(eager(shape).class, type => [<Link href={type}>{prefixed(type)}</Link>]),
			opt(getShapeSummary(shape), wrap),
			checks.length > 0 ? [`checks: ${checks.join(", ")}`] : undefined
		]}/>

		<Keyword>interface</Keyword> {name}
		{parents.length > 0 && <> <Keyword>extends</Keyword> <Joined links={parents} separator={", "}/></>}
		{" {\n"}

		{members.length > 0 && <>{"\n"}{members.map((member, index) => {

			const {
				term, optional, plural, minCount, maxCount, types, dictionary, label, predicate, reverse, summary
			} = member;

			const counted = types.length > 0 && (minCount > 1 || maxCount !== undefined && maxCount > 1);
			const lines = [
				...(counted ? [`count: ${bounded(minCount, maxCount)}`] : []),
				...constrain({ ...member, types: [...types, ...opt(dictionary, dictionary => [dictionary]) ?? []] })
					.map(({ label, values }) => `${label}: ${values.join(", ")}`)
			];

			return <Fragment key={term}>
				{index > 0 && "\n"}
				<Comment indent={"\t"} blocks={[
					opt(label, label => [label]),
					predicate === undefined && reverse === undefined ? undefined : [
						...opt(predicate, iri => [<Link href={iri}>{prefixed(iri)}</Link>]) ?? [],
						...opt(reverse, iri => [<>^<Link href={iri}>{prefixed(iri)}</Link></>]) ?? []
					],
					opt(summary, wrap),
					lines.length > 0 ? lines : undefined
				]}/>
				{"\t"}<Keyword>readonly</Keyword> {term}{optional ? "?" : ""}: {opt(dictionary, mapped)}
				{dictionary !== undefined && types.length > 0 && " | "}
				{types.length > 0 && <>
					{plural && <><Keyword>readonly</Keyword> </>}
					{plural && types.length > 1 && "("}<Joined links={types} separator={" | "}/>{plural && types.length > 1 && ")"}
					{plural && "[]"}
				</>}{"\n"}
			</Fragment>;

		})}{"\n"}</>}

		{"}"}

	</Code>;

}



/**
 * Spells out the TypeScript type of localised text: one string per language tag if unique, an array otherwise.
 */
function mapped({ restrictions: { uniqueLang } }: ShapeType): string {
	return uniqueLang ? "{ readonly [tag: string]: string }" : "{ readonly [tag: string]: readonly string[] }";
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

	return stated.length > 0 ? <span class={"tile-shape-comment"}>
		{`${indent}/**\n`}
		{stated.map((lines, index) => <Fragment key={index}>
			{index > 0 && `${indent} *\n`}
			{lines.map((line, key) => <Fragment key={key}>{`${indent} * `}{line}{"\n"}</Fragment>)}
		</Fragment>)}
		{`${indent} */\n`}
	</span> : undefined;

}

/**
 * Breaks a text into lines short enough to keep a doc comment within the width of a code block.
 */
function wrap(text: string): readonly string[] {
	return text.match(/\S.{0,99}(?=\s|$)|\S+/g) ?? [];
}


/**
 * Sets out a list of types inline, joined by a separator, each linked to its documentation where located.
 */
function Joined({ links, separator }: { links: readonly ShapeLink[], separator: string }) {
	return <>{links.map(({ name, href }, index) => <Fragment key={index}>
		{index > 0 && separator}{href === undefined ? name : <Link href={href}>{name}</Link>}
	</Fragment>)}</>;
}
