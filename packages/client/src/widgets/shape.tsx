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
import { TOC, type TOCEntry } from "@metreeca/clay-widgets/toc";
import { isArray, isString, type Lazy, opt, type Optional } from "@metreeca/core";
import type { Some } from "@metreeca/core/arrays";
import { details, summary } from "@metreeca/work/core/strings.js";
import { type ComponentChildren, Fragment } from "preact";
import { useId, useRef, useState } from "preact/hooks";
import {
	getShapeExtenders,
	getShapeInterface,
	getShapeParents,
	getShapeReferrers,
	getShapeSchema,
	getShapeSummary,
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
 * @returns A table of contents grouping the entries under their labels, or nothing if no entry states any content
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

	const groups: readonly { label: string, entries: readonly TOCEntry[] }[] = [

		{ label: "Classes", entries: opt(eager(shape).class, type => [{ label: prefixed(type), href: type }]) ?? [] },
		{ label: "Endpoint", entries: opt(endpoint, endpoint => [{ label: <code>{endpoint}</code> }]) ?? [] },
		{ label: "Extends", entries: parents.map(entry) },
		{ label: "Extended By", entries: extenders.map(entry) },
		{ label: "Referenced By", entries: referrers.map(entry) }

	];

	return <TOC name={"Model"} entries={groups.filter(({ entries }) => entries.length > 0)}/>;

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
 * documentation of their shapes; see {@link getShapeInterface} for the members it states. The interface is preceded
 * by a doc comment naming the class of the shape, linked to its definition, and stating its summary, and each member
 * by a doc comment naming its predicate, linked alike, and stating its summary; parts not stated are left out.
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

		<Comment blocks={[
			opt(eager(shape).class, type => [<Link href={type}>{prefixed(type)}</Link>]),
			opt(getShapeSummary(shape), wrap)
		]}/>

		<Keyword>interface</Keyword> {name}
		{parents.length > 0 && <> <Keyword>extends</Keyword> <Joined links={parents} separator={", "}/></>}
		{" {\n"}

		{members.length > 0 && <>{"\n"}{members.map(({
			term, optional, plural, types, predicate, summary
		}, index) => <Fragment key={term}>
			{index > 0 && "\n"}
			<Comment indent={"\t"} blocks={[
				opt(predicate, iri => [<Link href={iri}>{prefixed(iri)}</Link>]),
				opt(summary, wrap)
			]}/>
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
 *
 * Properties with details or constraints unfold one by one, and the column headings opening the table offer to unfold
 * or fold all of them at once, unfolding all while any is folded.
 */
function Table({ rows, inherited }: ShapeTable) {

	const [open, setOpen] = useState<ReadonlySet<string>>(new Set());

	const groups = [
		{ key: "", rows },
		...inherited.map(({ parent, rows }) => ({ key: parent.name, rows }))
	];

	const foldable = groups.flatMap(({ key, rows }) => rows
		.filter(row => disclose(row).length > 0)
		.map(({ term }) => `${key}/${term}`)
	);

	const folded = foldable.some(key => !open.has(key));

	function toggle(key: string) {
		setOpen(open => open.has(key)
			? new Set([...open].filter(entry => entry !== key))
			: new Set([...open, key])
		);
	}

	function rendered(key: string, row: ShapeRow) {
		return <Row key={row.term} {...row}
			open={open.has(`${key}/${row.term}`)}
			onToggle={() => toggle(`${key}/${row.term}`)}
		/>;
	}

	return <>

		{(rows.length > 0 || inherited.length > 0) && <table class={"ec2u-shape"}>

			<thead><Head toggle={foldable.length > 0 && <Button look={"subtle"}
				icon={folded ? <Icon.UnfoldAll/> : <Icon.FoldAll/>}
				title={folded ? "Unfold All" : "Fold All"}
				onClick={() => setOpen(new Set(folded ? foldable : []))}
			/>}/></thead>

			{rows.length > 0 && <tbody>{rows.map(row => rendered("", row))}</tbody>}

			{inherited.map(({ parent, rows }) => <tbody key={parent.name} class={"ec2u-shape-inherited"}>
				<tr>
					<th class={"ec2u-shape-from"}>inherited from</th>
					<th colSpan={4} class={"ec2u-shape-group"}>
						{parent.href === undefined ? parent.name : <Link look={"subtle"} href={parent.href}>{parent.name}</Link>}
					</th>
				</tr>
				<Head/>
				{rows.map(row => rendered(parent.name, row))}
			</tbody>)}

        </table>}

	</>;
}

/**
 * Sets out the column headings of the property table, opening the table and each group of inherited properties, with
 * the control folding the properties at the end, if given.
 */
function Head({ toggle }: { toggle?: ComponentChildren }) {
	return <tr class={"ec2u-shape-head"}>
		<th>property</th>
		<th>type</th>
		<th><abbr title={"Multiplicity"}>#</abbr></th>
		<th>description</th>
		<th class={"ec2u-shape-more"}>{toggle}</th>
	</tr>;
}

/**
 * Lists what a property discloses once unfolded: the details following the summary of its description, then each of
 * its constraints, labelled.
 */
function disclose({ description = "", constraints }: ShapeRow): readonly { label?: string, value: ComponentChildren }[] {

	const more = details(description);

	return [
		...(more ? [{ value: <Markdown>{more}</Markdown> }] : []),
		...constraints.map(({ label, value }) => ({ label, value: <code>{value}</code> }))
	];

}

/**
 * Sets out a property as a table row stating the summary of its description, followed, where the description goes on
 * past its summary or the property constrains its values, by rows disclosing the details and each constraint while
 * unfolded, with the label of a constraint under the type and its value under the description.
 */
function Row({ open, onToggle, ...row }: ShapeRow & {

	/**
	 * Whether the disclosed rows are on show.
	 */
	open: boolean

	/**
	 * Receives the request to unfold or fold the disclosed rows.
	 */
	onToggle: () => void

}) {

	const { term, predicate, types, cardinality, description = "" } = row;

	const id = useId();

	const brief = summary(description);
	const disclosed = disclose(row);

	const ids = disclosed.map((_, index) => `${id}-${index}`);

	return <>

		<tr class={disclosed.length > 0 && open ? "ec2u-shape-open" : undefined}>
			<td class={"ec2u-shape-term"}>
				{predicate === undefined ? term : <Link look={"subtle"} href={predicate}>{term}</Link>}
			</td>
			<td class={"ec2u-shape-type"}><Union links={types}/></td>
			<td class={/^[1-9]/.test(cardinality) ? "ec2u-shape-count ec2u-shape-required" : "ec2u-shape-count"}>
				{cardinality}
			</td>
			<td>{brief && <Markdown>{brief}</Markdown>}</td>
			<td class={"ec2u-shape-more"}>{disclosed.length > 0 && <Button look={"subtle"}
				controls={ids.join(" ")}
				expanded={open}
				icon={open ? <Icon.Fold/> : <Icon.Unfold/>}
				title={open ? "Fold" : "Unfold"}
				onClick={onToggle}
			/>}</td>
		</tr>

		{disclosed.map(({ label, value }, index) => <tr key={index}
			id={ids[index]}
			hidden={!open}
			class={index < disclosed.length-1 ? "ec2u-shape-details" : "ec2u-shape-details ec2u-shape-end"}
		>
			<td/>
			<td class={"ec2u-shape-key"}>{label}</td>
			<td/>
			<td class={label === undefined ? undefined : "ec2u-shape-value"}>{value}</td>
			<td/>
		</tr>)}

	</>;

}

/**
 * Sets out a code block, with a button copying its text, as shown, to the clipboard.
 */
function Code({ children }: { children: ComponentChildren }) {

	const code = useRef<HTMLElement>(null);

	return <pre class={"ec2u-shape-code"}>

		<Button icon={
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
 * Sets out an indented doc comment of a code block, its blocks of lines separated by empty lines; nothing if all are
 * missing, so that a member or an interface stating neither predicate, class nor summary is left uncommented.
 */
function Comment({ indent = "", blocks }: {
	indent?: string
	blocks: readonly Optional<readonly ComponentChildren[]>[]
}) {

	const stated = blocks.filter(block => block !== undefined);

	return stated.length > 0 ? <span class={"ec2u-shape-comment"}>
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
 * Lists a shape as a table of contents entry, linked to its documentation where located.
 */
function entry({ name, href }: ShapeLink): TOCEntry {
	return { label: name, href };
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
