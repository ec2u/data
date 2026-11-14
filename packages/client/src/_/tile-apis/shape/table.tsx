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
import { Markdown } from "@metreeca/clay-markdown/markdown";
import { Button } from "@metreeca/clay-widgets/button";
import { Icon } from "@metreeca/clay-widgets/icon";
import { Link } from "@metreeca/clay-widgets/link";
import { type Lazy, opt } from "@metreeca/core";
import { details, summary } from "@metreeca/work/core/_strings.js";
import type { ComponentChildren } from "preact";
import { useId, useState } from "preact/hooks";
import { bounded, constrain } from "./constraints.js";
import { prefixed, type ShapeLink, type ShapeRow, type ShapeTable, tabulate } from "./index.js";
import "./table.css";


/**
 * Creates the documentation of a resource shape.
 *
 * Sets out a table of the members the shape declares or inherits, including the identifier and the class of its
 * resources, each with the type and number of its values and the summary of its description. Members unfold to
 * disclose the rest of their description, their label, the predicates they map to and the constraints on their values.
 *
 * The page hosting the table provides the heading, the description and the location of the shape. Its property sheet,
 * set out by `ShapeInfo` in the lineage tile, also lists the custom checks its resources must pass.
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

		{(rows.length > 0 || inherited.length > 0) && <table class={"tile-shape"} role={"table"}>

			<tbody role={"rowgroup"}>
				<Head toggle={foldable.length > 0 && <Button look={"subtle"}
					icon={folded ? <Icon.UnfoldAll/> : <Icon.FoldAll/>}
					title={folded ? "Unfold All" : "Fold All"}
					onClick={() => setOpen(new Set(folded ? foldable : []))}
				/>}/>
				{rows.map(row => rendered("", row))}
			</tbody>

			{inherited.map(({ parent, rows }) => <tbody key={parent.name} class={"tile-shape-inherited"} role={"rowgroup"}>
				<tr role={"row"}>
					<th class={"tile-shape-from"} role={"rowheader"}>inherited from</th>
					<th colSpan={4} class={"tile-shape-group"} role={"cell"}>
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
	return <tr class={"tile-shape-head"} role={"row"}>
		<th role={"columnheader"}>property</th>
		<th role={"columnheader"}>type</th>
		<th role={"columnheader"}><abbr title={"Multiplicity"}>#</abbr></th>
		<th role={"columnheader"}>description</th>
		<th class={"tile-shape-more"} role={"columnheader"}>{toggle}</th>
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
			value: <span class={"tile-shape-literal"} title={iri}><Link href={iri}>{prefixed(iri)}</Link></span>
		}]) ?? [],
		...opt(reverse, iri => [{
			label: "inverse",
			value: <span class={"tile-shape-literal"} title={iri}><Link href={iri}>{prefixed(iri)}</Link></span>
		}]) ?? [],
		...constrain(row).map(({ label, values }) => ({
			label, value: values.map((value, index) => <span key={index} class={"tile-shape-literal"} title={value}>
				{value}
			</span>)
		}))
	];

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

		<tr role={"row"} class={disclosed.length > 0 && open ? "tile-shape-open" : undefined}>
			<td role={"cell"} class={"tile-shape-term"}>
				{target === undefined ? term : <Link look={"subtle"} href={target}>{term}</Link>}
			</td>
			<td role={"cell"} class={"tile-shape-type"}><Union links={types}/></td>
			<td role={"cell"} class={minCount > 0 ? "tile-shape-count tile-shape-required" : "tile-shape-count"}>
				{bounded(minCount, maxCount)}
			</td>
			<td role={"cell"}>{brief && <Markdown>{brief}</Markdown>}</td>
			<td role={"cell"} class={"tile-shape-more"}>{disclosed.length > 0 && <Button look={"subtle"}
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
				"tile-shape-details",
				...(label === undefined ? ["tile-shape-text"] : []),
				...(index < disclosed.length-1 ? [] : ["tile-shape-end"])
			].join(" ")}
		>
			<td role={"cell"}/>
			<td role={"cell"} class={"tile-shape-key"}><div title={label}>{label}</div></td>
			<td role={"cell"}/>
			<td role={"cell"} class={label === undefined ? undefined : "tile-shape-value"}><div>{value}</div></td>
			<td role={"cell"}/>
		</tr>)}

	</>;

}

/**
 * Sets out alternative types one per line, prefixed by `|` and linked to their pages; a lone type has no prefix.
 */
function Union({ links }: { links: readonly ShapeLink[] }) {
	return <>{links.map(({ name, href }, index) => <div key={index} class={"tile-shape-branch"}>
		{links.length > 1 && "| "}
		{href === undefined ? name : <Link href={href}>{name}</Link>}
	</div>)}</>;
}
