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

import { Button } from "@metreeca/clay-widgets/button";
import { Icon } from "@metreeca/clay-widgets/icon";
import { type ComponentChildren, createElement } from "preact";
import { useState } from "preact/hooks";
import "./tree.css";


/**
 * Creates a tree node.
 *
 * Shows a label beside a toggle that expands and collapses the nested nodes. Nested nodes are rendered only while the
 * node is expanded, so a subtree retrieving its own content is fetched only once the reader opens it.
 *
 * A node given no nested nodes is a leaf: its toggle is disabled and it never expands.
 */
export function Tree({

	expanded = false,
	label,

	children

}: {

	/**
	 * Whether the node starts expanded; collapsed if omitted.
	 */
	expanded?: boolean

	/**
	 * The content naming the node, beside its toggle.
	 */
	label: ComponentChildren

	/**
	 * The nested nodes, shown below the label while the node is expanded; a leaf if omitted.
	 */
	children?: ComponentChildren

}) {

	const branch = children !== undefined && children !== null;

	const [open, setOpen] = useState(expanded);


	function toggle() {
		setOpen(open => !open);
	}


	return createElement("clay-tree", { expanded: branch && open }, <>

		<header>

			<Button disabled={!branch} look={"subtle"}

				icon={branch && open ? <Icon.Collapse/> : <Icon.Expand/>}
				title={branch && open ? "Collapse" : "Expand"}

				onClick={toggle}

			/>

			<span>{label}</span>

		</header>

		{branch && open && <section>{children}</section>}

	</>);

}

/**
 * Creates a tree placeholder.
 *
 * Shows a note standing in for tree nodes that are missing, such as "No Matches" under a search returning nothing, set
 * in the placeholder colour, with a leading glyph lined up under the glyph of a search box placed right above it.
 */
export function TreePlaceholder({

	children

}: {

	/**
	 * The content of the note: a leading glyph followed by its wording.
	 */
	children: ComponentChildren

}) {

	return createElement("clay-tree-placeholder", {}, children);

}
