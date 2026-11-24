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
import { Markdown } from "@grafctory/clay-markdown/markdown";
import { Button } from "@grafctory/clay-widgets/button";
import { Icon } from "@grafctory/clay-widgets/icon";
import { Link } from "@grafctory/clay-widgets/link";
import { opt } from "@grafctory/core";
import type { Lexicon } from "@grafctory/core/resource";
import { details, summary } from "@grafctory/core/strings";
import { type ComponentChildren, Fragment } from "preact";
import { useId, useState } from "preact/hooks";
import { getDatatype } from "./datatypes.core.js";
import type { Endpoints } from "./endpoints.core.js";
import { bounded, constrain, type ShapeMember } from "./index.core.js";
import { getShapeTable } from "./properties.core.js";
import "./index.css";
import { getShape, prefixed, type ShapeLink } from "./shapes.core.js";
import "./properties.css";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates the documentation of a resource shape.
 *
 * Sets out a table of the members the shape declares or inherits, including the identifier and the class of its
 * resources, each with the type and number of its values and the summary of its description, the inherited ones
 * grouped under the ancestor documenting them. Members unfold to disclose the rest of their description, their label,
 * the predicates they map to and the constraints on their values, one by one or all at once from the column headings
 * opening the table, which stay in view while the rows of their group scroll by.
 *
 * The page hosting the table provides the heading, the description and the location of the shape. Its property sheet,
 * set out by `ShapeInfo` beside the table, also lists the custom checks its resources must pass.
 *
 * Sets out nothing if no shape of the model carries the given identifier.
 *
 * @param options The widget configuration
 *
 * @returns The shape documentation
 */
export function ShapeProperties({

	id,
	endpoints,
	lexicon

}: {

	/**
	 * The identifier of the shape to be documented, as the last step of the route of its documentation page.
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
		<Properties endpoints={endpoints} lexicon={lexicon} shape={shape}/>
	) ?? null;
}

/**
 * Sets out the members table of a shape of the model.
 */
function Properties({

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
	 * The shape to be documented.
	 */
	shape: ResourceShape

}) {

	const { rows, inherited } = getShapeTable(endpoints, lexicon, shape);

	const groups = [{ key: "", rows }, ...inherited.map(({ parent, rows }) => ({ key: parent.name, rows }))];

	const foldable = groups.flatMap(({ key, rows }) => rows
		.filter(row => disclose(lexicon, row).length > 0)
		.map(({ term }) => `${key}/${term}`)
	);

	const { open, folded, toggle, toggleAll } = useFolding(foldable);

	function rendered(key: string, row: ShapeMember) {
		return <Row key={row.term} lexicon={lexicon} {...row}
			open={open.has(`${key}/${row.term}`)}
			onToggle={() => toggle(`${key}/${row.term}`)}
		/>;
	}

	return (rows.length > 0 || inherited.length > 0) && <table class={"tile-api-shape"} role={"table"}>

        <tbody role={"rowgroup"}>
            <Head toggle={foldable.length > 0 && <FoldAll folded={folded} onToggle={toggleAll}/>}/>
			{rows.slice(0, -1).map(row => rendered("", row))}
        </tbody>

        <Last>{rows.slice(-1).map(row => rendered("", row))}</Last>

		{inherited.map(({ parent, rows }) => <Fragment key={parent.name}>

			<tbody class={"tile-api-shape-inherited"} role={"rowgroup"}>
				<tr role={"row"}>
					<th class={"tile-api-shape-from"} role={"rowheader"}>inherited from</th>
					<th colSpan={4} class={"tile-api-shape-group"} role={"cell"}>
						{parent.href === undefined ? parent.name : <Link href={parent.href}>{parent.name}</Link>}
					</th>
				</tr>
				<Head/>
				{rows.slice(0, -1).map(row => rendered(parent.name, row))}
			</tbody>

			<Last>{rows.slice(-1).map(row => rendered(parent.name, row))}</Last>

		</Fragment>)}

    </table>;

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Sets out the column headings of the member table, opening the table and each group of inherited members. The control
 * unfolding or folding all members, if given, closes the headings; only the headings opening the table carry one.
 */
function Head({ toggle }: { toggle?: ComponentChildren }) {
	return <tr class={"tile-api-shape-head"} role={"row"}>
		<th role={"columnheader"}>property</th>
		<th role={"columnheader"}>type</th>
		<th role={"columnheader"}><abbr title={"Multiplicity"}>#</abbr></th>
		<th role={"columnheader"}>description</th>
		<th class={"tile-api-shape-more"} role={"columnheader"}>{toggle}</th>
	</tr>;
}

/**
 * Sets out a member as a table row stating the type and number of its values and the summary of its description.
 *
 * Where the member has anything to {@link disclose}, further rows set it out while unfolded, one entry per row, each
 * with its label in the type column and its value in the description column, keeping the two aligned with the row.
 */
function Row({ lexicon, open, onToggle, ...row }: ShapeMember & {

	/**
	 * The prefixes abbreviating the IRIs of the model.
	 */
	lexicon: Lexicon

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
	const disclosed = disclose(lexicon, row);

	const ids = disclosed.map((_, index) => `${id}-${index}`);

	return <>

		<tr role={"row"} class={disclosed.length > 0 && open ? "tile-api-shape-open" : undefined}>
			<td role={"cell"} class={"tile-api-shape-term"}>
				{target === undefined ? term : <Link look={"subtle"} href={target}>{term}</Link>}
			</td>
			<td role={"cell"} class={"tile-api-shape-type"}><Union links={types}/></td>
			<td role={"cell"} class={minCount > 0 ? "tile-api-shape-count tile-api-shape-required" : "tile-api-shape-count"}>
				{bounded(minCount, maxCount)}
			</td>
			<td role={"cell"}>{brief && <Markdown>{brief}</Markdown>}</td>
			<td role={"cell"} class={"tile-api-shape-more"}>{disclosed.length > 0 &&
                <Fold open={open} controls={ids} onToggle={onToggle}/>
			}</td>
		</tr>

		{disclosed.map(({ label, value }, index) => <tr key={index} role={"row"}
			id={ids[index]}
			hidden={!open}
			class={[
				"tile-api-shape-details",
				...(label === undefined ? ["tile-api-shape-text"] : []),
				...(index < disclosed.length-1 ? [] : ["tile-api-shape-end"])
			].join(" ")}
		>
			<td role={"cell"}/>
			<td role={"cell"} class={"tile-api-shape-key"}>
				<div title={label}>{label}</div>
			</td>
			<td role={"cell"}/>
			<td role={"cell"} class={label === undefined ? undefined : "tile-api-shape-value"}>
				<div>{value}</div>
			</td>
			<td role={"cell"}/>
		</tr>)}

	</>;

}

/**
 * Sets out the last entry of a group of rows in a row group of its own.
 *
 * Sticky column headings are held within their row group, so the headings of the group leave as soon as the top of
 * its last entry reaches them, whatever the height of the entry, and scroll away together with it.
 */
export function Last({ children }: { children: ComponentChildren }) {
	return <tbody role={"rowgroup"}>{children}</tbody>;
}

/**
 * Sets out the control unfolding all entries while any is folded, folding all otherwise.
 */
export function FoldAll({ folded, onToggle }: { folded: boolean, onToggle: () => void }) {
	return <Button look={"subtle"}
		icon={folded ? <Icon.UnfoldAll/> : <Icon.FoldAll/>}
		title={folded ? "Unfold All" : "Fold All"}
		onClick={onToggle}
	/>;
}

/**
 * Sets out the control unfolding or folding the rows an entry discloses, identified by `controls`.
 */
export function Fold({ open, controls, onToggle }: {
	open: boolean,
	controls: readonly string[],
	onToggle: () => void
}) {
	return <Button look={"subtle"}
		controls={controls.join(" ")}
		expanded={open}
		icon={open ? <Icon.Fold/> : <Icon.Unfold/>}
		title={open ? "Fold" : "Unfold"}
		onClick={onToggle}
	/>;
}

/**
 * Sets out an IRI as its prefixed name, linked to its definition, which is the IRI itself unless stated otherwise.
 */
export function Term({ lexicon, iri, href = iri }: { lexicon: Lexicon, iri: string, href?: string }) {
	return <span class={"tile-api-shape-literal"} title={iri}><Link href={href}>{prefixed(lexicon, iri)}</Link></span>;
}

/**
 * Sets out alternative types one per line, prefixed by `|` and linked to their pages, datatypes in monospace; a lone
 * type has no prefix.
 */
function Union({ links }: { links: readonly ShapeLink[] }) {
	return <>{links.map(({ name, href }, index) => {

		const label = getDatatype(name) === undefined ? name : <span class={"tile-api-code"}>{name}</span>;

		return <div key={index} class={"tile-api-shape-branch"}>
			{links.length > 1 && "| "}
			{href === undefined ? label : <Link href={href}>{label}</Link>}
		</div>;

	})}</>;
}

/**
 * Renders a one-line datatype text within the flow of a table cell, setting its code spans in the mono face of the
 * API docs and its Markdown links as links, and leaving any other markup as it stands.
 */
export function Inline({ text }: { text: string }) {
	return <>{text.split(/(`[^`]*`|\[[^\]]*]\([^)]*\))/).map((part, index) => {

		const link = part.match(/^\[([^\]]*)]\(([^)]*)\)$/);

		return part.length > 1 && part.startsWith("`") && part.endsWith("`")
			? <span key={index} class={"tile-api-code"}>{part.slice(1, -1)}</span>
			: link !== null ? <Link key={index} href={link[2] ?? ""}>{link[1]}</Link>
				: part;

	})}</>;
}

/**
 * Tracks which of a set of foldable entries are unfolded.
 *
 * @param keys The keys of the foldable entries
 *
 * @returns The keys of the unfolded entries, whether any entry is folded, and the actions unfolding or folding a single
 *     entry and, while any is folded, unfolding all of them, folding all otherwise
 */
export function useFolding(keys: readonly string[]) {

	const [open, setOpen] = useState<ReadonlySet<string>>(new Set());

	const folded = keys.some(key => !open.has(key));

	return {
		open,
		folded,
		toggle: (key: string) => setOpen(open => open.has(key)
			? new Set([...open].filter(entry => entry !== key))
			: new Set([...open, key])
		),
		toggleAll: () => setOpen(new Set(folded ? keys : []))
	};

}

/**
 * Lists what a member discloses once unfolded: the details following the summary of its description, its label, its
 * forward and inverse predicates, linked to their definitions, then each of its constraints, labelled.
 */
function disclose(lexicon: Lexicon, row: ShapeMember): readonly { label?: string, value: ComponentChildren }[] {

	const { description = "", label, predicate, reverse } = row;
	const more = details(description);

	return [
		...(more ? [{ value: <Markdown>{more}</Markdown> }] : []),
		...opt(label, label => [{ label: "label", value: label }]) ?? [],
		...opt(predicate, iri => [{ label: "predicate", value: <Term lexicon={lexicon} iri={iri}/> }]) ?? [],
		...opt(reverse, iri => [{ label: "inverse", value: <Term lexicon={lexicon} iri={iri}/> }]) ?? [],
		...constrain(lexicon, row).map(({ label, values }) => ({
			label, value: values.map((value, index) => <span key={index} class={"tile-api-shape-literal"} title={value}>
				{value}
			</span>)
		}))
	];

}
