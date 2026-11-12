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
import { equals } from "@metreeca/core/values";
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
	type ShapeRestrictions,
	type ShapeRow,
	type ShapeSchemaValue,
	type ShapeTable,
	type ShapeType,
	tabulate
} from "./shape.core.js";
import "./shape.css";


/**
 * Creates the property sheet of a resource shape.
 *
 * Locates the shape in the model: its target class as a prefixed name linked to its definition, its endpoint, the
 * custom checks its resources must pass, and the shapes it extends, extending it directly or referring to it, linked
 * to their documentation, omitting empty entries.
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

	const { endpoint, checks } = tabulate(shape);
	const parents = getShapeParents(shape);
	const extenders = getShapeExtenders(shape, universe);
	const referrers = getShapeReferrers(shape, universe);

	const groups: readonly { label: string, entries: readonly TOCEntry[] }[] = [

		{ label: "Classes", entries: opt(eager(shape).class, type => [{ label: prefixed(type), href: type }]) ?? [] },
		{ label: "Endpoint", entries: opt(endpoint, endpoint => [{ label: <code>{endpoint}</code> }]) ?? [] },
		{ label: "Checks", entries: checks.map(check => ({ label: <code>{check}</code> })) },
		{ label: "Extends", entries: parents.map(entry) },
		{ label: "Extended By", entries: extenders.map(entry) },
		{ label: "Referenced By", entries: referrers.map(entry) }

	];

	return <TOC name={"Model"} entries={groups.filter(({ entries }) => entries.length > 0)}/>;

}

/**
 * Creates the documentation of a resource shape.
 *
 * Sets out a table of the members the shape declares or inherits, including the identifier and the class of its
 * resources, each with the type and number of its values and the summary of its description. Members unfold to
 * disclose the rest of their description, their label, the predicates they map to and the constraints on their values.
 *
 * Heading, describing and locating the shape is left to the page, as is linking to it; see {@link ShapeInfo} for its
 * property sheet, which also lists the custom checks its resources must pass beyond these constraints.
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
 * by a doc comment naming the class of the shape, linked to its definition, its summary and its custom checks, and
 * each member by a doc comment stating its label, its predicates, linked alike and an inverse one prefixed by `^`, its
 * summary, and the bounds and constraints its type cannot convey; parts not stated are left out.
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
 * Sets out the table of the members of a shape, the inherited ones grouped under the ancestor documenting them.
 *
 * Members with anything to disclose unfold one by one. The column headings opening the table offer to unfold or fold
 * all of them at once, unfolding all while any is folded, and stay in view while the rows of their group scroll by.
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

		{(rows.length > 0 || inherited.length > 0) && <table class={"ec2u-shape"} role={"table"}>

			<tbody role={"rowgroup"}>
				<Head toggle={foldable.length > 0 && <Button look={"subtle"}
					icon={folded ? <Icon.UnfoldAll/> : <Icon.FoldAll/>}
					title={folded ? "Unfold All" : "Fold All"}
					onClick={() => setOpen(new Set(folded ? foldable : []))}
				/>}/>
				{rows.map(row => rendered("", row))}
			</tbody>

			{inherited.map(({ parent, rows }) => <tbody key={parent.name} class={"ec2u-shape-inherited"} role={"rowgroup"}>
				<tr role={"row"}>
					<th class={"ec2u-shape-from"} role={"rowheader"}>inherited from</th>
					<th colSpan={4} class={"ec2u-shape-group"} role={"cell"}>
						{parent.href === undefined ? parent.name : <Link href={parent.href}>{parent.name}</Link>}
					</th>
				</tr>
				<Head/>
				{rows.map(row => rendered(parent.name, row))}
			</tbody>)}

        </table>}

	</>;
}

/**
 * Sets out the column headings of the member table, opening the table and each group of inherited members. The control
 * unfolding or folding all members, if given, closes the headings; only the headings opening the table carry one.
 */
function Head({ toggle }: { toggle?: ComponentChildren }) {
	return <tr class={"ec2u-shape-head"} role={"row"}>
		<th role={"columnheader"}>property</th>
		<th role={"columnheader"}>type</th>
		<th role={"columnheader"}><abbr title={"Multiplicity"}>#</abbr></th>
		<th role={"columnheader"}>description</th>
		<th class={"ec2u-shape-more"} role={"columnheader"}>{toggle}</th>
	</tr>;
}

/**
 * Lists what a member discloses once unfolded: the details following the summary of its description, its label, its
 * forward and inverse predicates, linked to their definitions, then each of its constraints, labelled.
 */
function disclose(row: ShapeRow): readonly { label?: string, value: ComponentChildren }[] {

	const { description = "", label, predicate, reverse } = row;
	const more = details(description);

	return [
		...(more ? [{ value: <Markdown>{more}</Markdown> }] : []),
		...opt(label, label => [{ label: "label", value: label }]) ?? [],
		...opt(predicate, iri => [{
			label: "predicate",
			value: <span class={"ec2u-shape-literal"} title={iri}><Link href={iri}>{prefixed(iri)}</Link></span>
		}]) ?? [],
		...opt(reverse, iri => [{
			label: "inverse",
			value: <span class={"ec2u-shape-literal"} title={iri}><Link href={iri}>{prefixed(iri)}</Link></span>
		}]) ?? [],
		...constrain(row).map(({ label, values }) => ({
			label, value: values.map((value, index) => <span key={index} class={"ec2u-shape-literal"} title={value}>
				{value}
			</span>)
		}))
	];

}

/**
 * A constraint on the values of a member, as labelled and spelled out for reading, one entry for each value it lists.
 */
type Constraint = {

	readonly label: string
	readonly values: readonly string[]

};

/**
 * Spells out the constraints a member states: the restrictions of each of its types, stated once where all its types
 * agree on them and prefixed by the type they apply to otherwise, followed by the ones on the member itself.
 */
function constrain({ types, managed, foreign, captive }: {
	readonly types: readonly ShapeType[]
	readonly managed: boolean
	readonly foreign: boolean
	readonly captive: boolean
}): readonly Constraint[] {

	const restricted = types.flatMap(({ name, restrictions }) => restrict(restrictions).map(constraint => ({
		...constraint, type: name
	})));

	const labels = [...new Set(restricted.map(({ label }) => label))];

	return [

		...labels.map(label => {

			const matching = restricted.filter(constraint => constraint.label === label);
			const [first] = matching;

			return {
				label, values: first !== undefined && matching.every(({ values }) => equals(values, first.values))
					? first.values
					: matching.flatMap(({ type, values }) => values.map(value => `${type}: ${value}`))
			};

		}),

		...(managed ? [{ label: "read-only", values: ["set by the server"] }] : []),
		...(foreign ? [{ label: "read-only", values: ["set by the linked resources"] }] : []),
		...(captive ? [{ label: "lifecycle", values: ["bound"] }] : [])

	];

}

/**
 * Spells out the restrictions of a type, in a fixed order.
 */
function restrict({
	template, pattern, minLength, maxLength, languageIn, uniqueLang, integral,
	minInclusive, minExclusive, maxInclusive, maxExclusive, in: values, hasValue
}: ShapeRestrictions): readonly Constraint[] {

	const entries: readonly (readonly [string, readonly string[]])[] = [
		["id space", opt(template, template => [template]) ?? []],
		["pattern", opt(pattern, pattern => [pattern]) ?? []],
		["characters", opt(ranged(minLength, maxLength), range => [range]) ?? []],
		["languages", [...listed(languageIn), ...(uniqueLang ? ["one value each"] : [])]],
		["integral", integral ? ["yes"] : []],
		["minimum", opt(minInclusive, value => [`≥ ${value}`]) ?? opt(minExclusive, value => [`> ${value}`]) ?? []],
		["maximum", opt(maxInclusive, value => [`≤ ${value}`]) ?? opt(maxExclusive, value => [`< ${value}`]) ?? []],
		["values", listed(values)],
		["value", listed(hasValue)]
	];

	return entries.flatMap(([label, values]) => values.length === 0 ? [] : [{ label, values }]);

}

/**
 * Spells out a length range, as `1‥64`, `≥ 1` or `≤ 100`; none if neither bound is stated.
 */
function ranged(min: Optional<number>, max: Optional<number>): Optional<string> {
	return min === undefined ? opt(max, value => `≤ ${value}`)
		: max === undefined ? `≥ ${min}`
			: `${min}‥${max}`;
}

/**
 * Spells out each value of a list, abbreviating IRIs as prefixed names; empty if the list is missing.
 */
function listed(values: Optional<readonly (string | number | boolean)[]>): readonly string[] {
	return (values ?? []).map(value => isString(value) ? prefixed(value) : String(value));
}

/**
 * Spells out the number of values a member admits: `1`, `0‥1`, `*`, `1‥*`, or `min‥max` for other bounds, with an
 * open upper bound stated as `*` and the bounds joined by a two dot leader (U+2025) set as a single glyph.
 */
function bounded(min: number, max: Optional<number>): string {
	return min === 1 && max === 1 ? "1"
		: min === 0 && max === 1 ? "0‥1"
			: min === 0 && max === undefined ? "*"
				: `${min}‥${max ?? "*"}`;
}

/**
 * Spells out the TypeScript type of localised text: a map from language tags to a single string where each tag
 * carries one, to an array of strings otherwise.
 */
function mapped({ restrictions: { uniqueLang } }: ShapeType): string {
	return uniqueLang ? "{ readonly [tag: string]: string }" : "{ readonly [tag: string]: readonly string[] }";
}

/**
 * Sets out a member as a table row stating the type and number of its values and the summary of its description.
 *
 * Where the member has anything to {@link disclose}, further rows set it out while unfolded, one entry per row, each
 * with its label in the type column and its value in the description column, keeping the two aligned with the row.
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

	const { term, predicate, reverse, types, minCount, maxCount, description = "" } = row;

	const target = predicate ?? reverse;

	const id = useId();

	const brief = summary(description);
	const disclosed = disclose(row);

	const ids = disclosed.map((_, index) => `${id}-${index}`);

	return <>

		<tr role={"row"} class={disclosed.length > 0 && open ? "ec2u-shape-open" : undefined}>
			<td role={"cell"} class={"ec2u-shape-term"}>
				{target === undefined ? term : <Link look={"subtle"} href={target}>{term}</Link>}
			</td>
			<td role={"cell"} class={"ec2u-shape-type"}><Union links={types}/></td>
			<td role={"cell"} class={minCount > 0 ? "ec2u-shape-count ec2u-shape-required" : "ec2u-shape-count"}>
				{bounded(minCount, maxCount)}
			</td>
			<td role={"cell"}>{brief && <Markdown>{brief}</Markdown>}</td>
			<td role={"cell"} class={"ec2u-shape-more"}>{disclosed.length > 0 && <Button look={"subtle"}
				controls={ids.join(" ")}
				expanded={open}
				icon={open ? <Icon.Fold/> : <Icon.Unfold/>}
				title={open ? "Fold" : "Unfold"}
				onClick={onToggle}
			/>}</td>
		</tr>

		{disclosed.map(({ label, value }, index) => <tr key={index} role={"row"}
			id={ids[index]}
			hidden={!open}
			class={[
				"ec2u-shape-details",
				...(label === undefined ? ["ec2u-shape-text"] : []),
				...(index < disclosed.length-1 ? [] : ["ec2u-shape-end"])
			].join(" ")}
		>
			<td role={"cell"}/>
			<td role={"cell"} class={"ec2u-shape-key"}><div title={label}>{label}</div></td>
			<td role={"cell"}/>
			<td role={"cell"} class={label === undefined ? undefined : "ec2u-shape-value"}><div>{value}</div></td>
			<td role={"cell"}/>
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
