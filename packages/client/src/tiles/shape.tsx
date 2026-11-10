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
import { Markdown } from "@metreeca/clay-markdown/markdown";
import { Button } from "@metreeca/clay-widgets/button";
import { Icon } from "@metreeca/clay-widgets/icon";
import { Link } from "@metreeca/clay-widgets/link";
import { Stack } from "@metreeca/clay-widgets/stack";
import { Style } from "@metreeca/clay-widgets/style";
import { Text } from "@metreeca/clay-widgets/text";
import { isArray, isString, type Lazy, opt } from "@metreeca/core";
import type { Some } from "@metreeca/core/arrays";
import { type ComponentChildren, Fragment } from "preact";
import { useRef } from "preact/hooks";
import {
	getShapeExtenders,
	getShapeInterface,
	getShapeParents,
	getShapeReferrers,
	getShapeSchema,
	prefixed,
	type ShapeLink,
	type ShapeRow,
	type ShapeSchemaValue,
	type ShapeTable,
	tabulate
} from "./shape.core.js";
import "./shape.css";


/**
 * Creates the property sheet of a resource shape.
 *
 * Locates the shape in the model: its target class as a prefixed name linked to its definition, its endpoint, and the
 * shapes it extends, extending it directly or referring to it, linked to their documentation, omitting empty entries.
 *
 * @param options The widget configuration
 *
 * @returns A stack of sections, each its label over its content, or nothing if no entry states any content
 */
export function ShapeInfo({

	shape,
	universe

}: {

	/**
	 * The shape to be located, possibly deferred.
	 */
	shape: Lazy<ResourceShape>

	/**
	 * The entry shapes of the model scanned for the properties referring to the shape, possibly deferred.
	 */
	universe: Some<Lazy<ResourceShape>>

}) {

	const { endpoint } = tabulate(shape);
	const parents = getShapeParents(shape);
	const extenders = getShapeExtenders(shape, universe);
	const referrers = getShapeReferrers(shape, universe);

	const stated = Object.entries({

		Classes: opt(eager(shape).class, type => <List links={[{ name: prefixed(type), href: type }]}/>),
		Endpoint: opt(endpoint, endpoint => <code>{endpoint}</code>),
		Extends: parents.length > 0 ? <List links={parents}/> : undefined,
		"Extended by": extenders.length > 0 ? <List links={extenders}/> : undefined,
		"Referenced by": referrers.length > 0 ? <List links={referrers}/> : undefined

	}).flatMap(([label, content]) => content !== undefined ? [{ label, content }] : []);

	return stated.length > 0 ? <Stack space={"spacing100"}>{stated.map(({ label, content }) =>

		<Stack key={label} space={"spacing050"}>
			<div><Style css={{ textLook: "subtle", fontSize: "fontSizeSmall" }}><Text>{label}</Text></Style></div>
			{/* body-sized line, sharing the baseline of the page text */}
			<div class={"ec2u-shape-info"}>{content}</div>
		</Stack>
	)}</Stack> : undefined;

}

/**
 * Creates the documentation of a resource shape.
 *
 * Sets out a table of the properties the shape declares, each with the predicate it maps to, the type and number of
 * its values, and its description. Heading, describing and locating the shape is left to the page, as is linking to
 * it; see {@link ShapeInfo} for its property sheet.
 *
 * @param options The widget configuration
 *
 * @returns The shape documentation
 */
export function Shape({

	shape

}: {

	/**
	 * The shape to be documented, possibly deferred.
	 */
	shape: Lazy<ResourceShape>

}) {

	return <Table {...tabulate(shape)}/>;

}

/**
 * Creates the TypeScript interface describing the resources of a shape.
 *
 * Sets out the interface as a code block, linking the interfaces it extends and the types of its members to the
 * documentation of their shapes; see {@link getShapeInterface} for the members it states.
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

	return <Code>

		<Keyword>interface</Keyword> {name}
		{parents.length > 0 && <> <Keyword>extends</Keyword> <Joined links={parents} separator={", "}/></>}
		{" {\n"}

		{members.length > 0 && <>{"\n"}{members.map(({ term, optional, plural, types }) => <Fragment key={term}>
			{"\t"}<Keyword>readonly</Keyword> {term}{optional ? "?" : ""}: {plural && <><Keyword>readonly</Keyword> </>}
			{plural && types.length > 1 && "("}<Joined links={types} separator={" | "}/>{plural && types.length > 1 && ")"}
			{plural && "[]"}{"\n"}
		</Fragment>)}{"\n"}</>}

		{"}"}

	</Code>;

}

/**
 * Creates the JSON Schema describing the resources of a shape.
 *
 * Sets out the {@link getShapeSchema | schema} as a code block, linking each `$ref` to the documentation it refers to.
 *
 * @param options The widget configuration
 *
 * @returns The schema declaration
 */
export function ShapeSchema({

	shape

}: {

	/**
	 * The shape to be described, possibly deferred.
	 */
	shape: Lazy<ResourceShape>

}) {

	return <Code><Json value={getShapeSchema(shape)} depth={0}/></Code>;

}


/**
 * Sets out the table of the properties of a shape, the inherited ones grouped under the ancestor documenting them.
 */
function Table({ rows, inherited }: ShapeTable) {
	return <>

		{(rows.length > 0 || inherited.length > 0) && <table class={"ec2u-shape"}>

            <thead>
                <tr>
                    <th>property</th>
                    <th>type</th>
                    <th>#</th>
                    <th>description</th>
                </tr>
            </thead>

			{rows.length > 0 && <tbody>{rows.map(row => <Row key={row.term} {...row}/>)}</tbody>}

			{inherited.map(({ parent, rows }) => <tbody key={parent.name} class={"ec2u-shape-inherited"}>
				<tr>
					<th colSpan={4}><Style css={{ textLook: "subtle" }}><Text>
						properties from {parent.href === undefined ? parent.name :
						<Link href={parent.href}>{parent.name}</Link>}
					</Text></Style></th>
				</tr>
				{rows.map(row => <Row key={row.term} {...row}/>)}
			</tbody>)}

        </table>}

	</>;
}

/**
 * Sets out a property as a table row.
 */
function Row({ term, predicate, types, cardinality, description }: ShapeRow) {
	return <tr>
		<td>{predicate === undefined ? term : <Link href={predicate}>{term}</Link>}</td>
		<td><Union links={types}/></td>
		<td>{cardinality}</td>
		<td>{opt(description, description => <Markdown>{description}</Markdown>)}</td>
	</tr>;
}

/**
 * Sets out a code block, with a button copying its text, as shown, to the clipboard.
 */
function Code({ children }: { children: ComponentChildren }) {

	const code = useRef<HTMLElement>(null);

	return <pre class={"ec2u-shape-code"}>

		<Button look={"subtle"} icon={
			<Icon.Copy/>} title={"Copy"} onClick={() => opt(code.current?.textContent ?? undefined,
			text => navigator.clipboard.writeText(text)
		)}/>

		<code ref={code}>{children}</code>

	</pre>;

}

/**
 * Sets out a keyword of a code block.
 */
function Keyword({ children }: { children: string }) {
	return <span class={"ec2u-shape-keyword"}>{children}</span>;
}

/**
 * Sets out a JSON value of a code block, indented by depth, linking the strings keyed by `$ref` to their documentation.
 */
function Json({ value, depth, link = false }: { value: ShapeSchemaValue, depth: number, link?: boolean }) {

	const indent = "\t".repeat(depth);

	return isString(value) ? link
			? <Link href={value}>{JSON.stringify(value)}</Link>
			: <span class={"ec2u-shape-string"}>{JSON.stringify(value)}</span>
		: typeof value === "number" || typeof value === "boolean" ? <Keyword>{JSON.stringify(value)}</Keyword>
			: isArray<ShapeSchemaValue>(value) ? <>[{value.map((item, index) => <Fragment key={index}>
					{index > 0 ? ",\n" : "\n"}{indent}{"\t"}<Json value={item} depth={depth+1}/>
				</Fragment>)}{value.length > 0 && `\n${indent}`}]</>
				: <>{"{"}{Object.entries(value).map(([key, item], index) => <Fragment key={key}>
					{index > 0 ? ",\n" : "\n"}{indent}{"\t"}<span class={"ec2u-shape-attr"}>{JSON.stringify(key)}</span>: <Json
					value={item} depth={depth+1} link={key === "$ref"}
				/>
				</Fragment>)}{Object.keys(value).length > 0 && `\n${indent}`}{"}"}</>;

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
 * Sets out a list of shapes as a bulleted list, each linked to its documentation where located.
 */
function List({ links }: { links: readonly ShapeLink[] }) {
	return <ul class={"ec2u-shape-links"}>{links.map(({ name, href }, index) => <li key={index}>
		{href === undefined ? name : <Link href={href}>{name}</Link>}
	</li>)}</ul>;
}

/**
 * Sets out the alternative types of a union one per line, each prefixed by `|` and linked to its documentation where
 * located; a single type is set out alone, with no prefix.
 */
function Union({ links }: { links: readonly ShapeLink[] }) {
	return <>{links.map(({ name, href }, index) => <div key={index} class={"ec2u-shape-branch"}>
		{links.length > 1 && "| "}
		{href === undefined ? name : <Link href={href}>{name}</Link>}
	</div>)}</>;
}
