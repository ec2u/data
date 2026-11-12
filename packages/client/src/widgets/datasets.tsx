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

import { Link } from "@metreeca/clay-widgets/link";
import { integer } from "@metreeca/tile/types/integer";
import { type ComponentChildren, createElement } from "preact";
import "./datasets.css";


/**
 * A dataset listed in a dataset grid.
 */
export type Dataset = {

	/** The address the title of the dataset links to; unique within a grid */
	readonly href: string

	/** The title of the dataset */
	readonly title: ComponentChildren

	/** The number of resources the dataset holds */
	readonly size: number

	/** The glyph set beside the description; blank if omitted */
	readonly glyph?: ComponentChildren

	/** How strongly the dataset stands out, from `1` (supporting) to `3` (core) */
	readonly priority: 1 | 2 | 3

	/** The description of the dataset */
	readonly description?: ComponentChildren

};


/**
 * Creates a grid of datasets.
 *
 * Lays the datasets out filling the width of the page, with titles and descriptions lined up across the cells of a
 * row however they wrap, and sizes and glyphs set in a column of the same width in every cell; priority sets how
 * strongly the leading edge and the glyph of each cell stand out, so that the tiers of a grid read apart at a glance.
 *
 * @param datasets The datasets to be listed, in display order
 *
 * @returns The dataset grid
 */
export function DatasetGrid({

	datasets

}: {

	datasets: readonly Dataset[]

}) {

	const width = Math.max(0, ...datasets.map(({ size }) => integer.format(size).length));

	return createElement("ec2u-dataset-grid", {
		style: { "--ec2u-dataset-grid-size-width": `${width}ch` }
	}, datasets.map(({

		href,
		title,
		size,
		glyph,
		priority,
		description

	}) => createElement("ec2u-dataset", { key: href, "data-priority": priority }, <>

		<span class="size">{integer.format(size)}</span>
		<span class="title"><Link href={href}>{title}</Link></span>
		<span class="glyph">{glyph}</span>
		<span class="description">{description}</span>

	</>)));

}
