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

import { opt } from "@grafctory/core";
import type { Lexicon } from "@grafctory/core/resource";
import { type ComponentChildren, Fragment } from "preact";
import { useId } from "preact/hooks";
import { type Datatype, datatypes, getDatatypeAnchor } from "./datatypes.core.js";
import { Fold, FoldAll, Inline, Last, Term, useFolding } from "./properties.js";
import "./properties.css";


/**
 * The headings of the groups datatypes are listed under, after the kind of value they admit.
 */
const headings: Readonly<Record<Datatype["group"], string>> = {
	boolean: "Booleans",
	number: "Numbers",
	string: "Strings",
	identifier: "Identifiers",
	temporal: "Temporal Values",
	dictionary: "Localised Text"
};


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates the documentation of the datatypes property values may take.
 *
 * Sets out the datatypes in the layout of a shape's members, so that a reader moving from a property to the datatype
 * of its values finds it laid out alike: each datatype with its description, grouped by the kind of value it admits,
 * as booleans, numbers, strings, identifiers, temporal values or localised text. Datatypes unfold to disclose
 * the forms their values take in JSON payloads, any caveat on their use and the RDF datatype their values are stored
 * as, linked to its definition. Each datatype is anchored, so that the types of property values link to it.
 *
 * @param options The widget configuration
 *
 * @returns The datatypes documentation
 */
export function APIDatatypes({

	lexicon

}: {

	/**
	 * The prefixes abbreviating the IRIs of the model.
	 */
	lexicon: Lexicon

}) {

	const { open, folded, toggle, toggleAll } = useFolding(datatypes.map(({ name }) => name));

	const groups = [...new Set(datatypes.map(({ group }) => group))];

	return <table class={"tile-api-shape tile-api-shape-datatypes"} role={"table"}>

		{groups.map((group, index) => {

			const rows = datatypes.filter(datatype => datatype.group === group).map(datatype =>
				<DatatypeRow key={datatype.name} lexicon={lexicon} {...datatype}
					open={open.has(datatype.name)}
					onToggle={() => toggle(datatype.name)}
				/>
			);

			return <Fragment key={group}>

				<tbody role={"rowgroup"}>

					<tr role={"row"}>
						<th colSpan={3} class={"tile-api-shape-group"} role={"cell"}>{headings[group]}</th>
					</tr>

					<tr class={"tile-api-shape-head"} role={"row"}>
						<th role={"columnheader"}>datatype</th>
						<th role={"columnheader"}>description</th>
						<th class={"tile-api-shape-more"} role={"columnheader"}>{index === 0 &&
                            <FoldAll folded={folded} onToggle={toggleAll}/>
						}</th>
					</tr>

					{rows.slice(0, -1)}

				</tbody>

				<Last>{rows.slice(-1)}</Last>

			</Fragment>;

		})}

	</table>;

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Sets out a datatype as a table row stating its description.
 *
 * Further rows set out, while unfolded, the forms its values take in JSON payloads, any caveat on its use and the RDF
 * datatype its values are stored as, each labelled under the name of the datatype.
 */
function DatatypeRow({ lexicon, open, onToggle, name, description, rdf, spec, json, warning }: Datatype & {

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

	const id = useId();

	const disclosed: readonly { label: string, value: ComponentChildren }[] = [
		{ label: "JSON", value: <Inline text={json.join(" · ")}/> },
		...opt(warning, warning => [{ label: "caveat", value: <Inline text={warning}/> }]) ?? [],
		{ label: "RDF", value: <Term lexicon={lexicon} iri={rdf} href={spec}/> }
	];

	const ids = disclosed.map((_, index) => `${id}-${index}`);

	return <>

		<tr role={"row"} class={open ? "tile-api-shape-open" : undefined}>
			<td role={"cell"} id={getDatatypeAnchor(name)} class={"tile-api-shape-term"}>{name}</td>
			<td role={"cell"}><Inline text={description}/></td>
			<td role={"cell"} class={"tile-api-shape-more"}><Fold open={open} controls={ids} onToggle={onToggle}/></td>
		</tr>

		{disclosed.map(({ label, value }, index) => <tr key={index} role={"row"}
			id={ids[index]}
			hidden={!open}
			class={["tile-api-shape-details", ...(index < disclosed.length-1 ? [] : ["tile-api-shape-end"])].join(" ")}
		>
			<td role={"cell"} class={"tile-api-shape-key"}>
				<div title={label}>{label}</div>
			</td>
			<td role={"cell"} class={"tile-api-shape-value"}>
				<div>{value}</div>
			</td>
			<td role={"cell"}/>
		</tr>)}

	</>;

}
