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

import { isContent } from "@metreeca/clay-widgets";
import { Empty } from "@metreeca/clay-widgets/empty";
import { type ComponentChildren, createElement } from "preact";
import "./card.css";
import { Pill } from "./pill.js";


/**
 * Creates a catalogue card.
 *
 * Sets the title over the description in a main column, and the badge over the image in a side column at the end of
 * the card. The description is cut short with an ellipsis past the given number of lines, and the image is held to
 * the height of the lines shown, so a run of cards keeps text and image ending together.
 *
 * The badge is set as a {@link Pill}, and an item with a description but no image of its own is shown by a tile
 * holding the glyph of its catalogue, so every catalogue lays its cards out alike from its data alone.
 *
 * Empty parts are left out, and a card left with none renders nothing.
 */
export function Card({

	lines = 3,

	title,
	badge,
	color,
	image,
	glyph,

	children

}: {

	/**
	 * The most lines the description shows before it is cut short with an ellipsis; `3` if omitted.
	 */
	lines?: number


	/**
	 * The title naming the item, at the top of the main column.
	 */
	title?: ComponentChildren

	/**
	 * The label classifying the item, set as a pill at the top of the side column across from the title.
	 */
	badge?: ComponentChildren

	/**
	 * The CSS colour accenting the badge pill.
	 */
	color?: string

	/**
	 * The picture standing for the item, under the badge in the side column, held to the height of the description.
	 */
	image?: ComponentChildren

	/**
	 * The glyph of the catalogue, shown in a tile in place of a missing image beside a stated description.
	 */
	glyph?: ComponentChildren


	/**
	 * The description of the item, under the title in the main column, clamped to `lines`.
	 */
	children?: ComponentChildren

}) {

	const side = isContent(image) ? image
		: isContent(children) && isContent(glyph) ? <Empty>{glyph}</Empty>
			: undefined;

	return [title, badge, side, children].some(isContent) ? createElement("ec2u-card", {
		style: { "--ec2u-card-lines": lines }
	}, <>

		{isContent(title) && <span>{title}</span>}
		{isContent(badge) && <span class="badge"><Pill color={color}>{badge}</Pill></span>}

		{isContent(children) && <div>{children}</div>}

		{isContent(side) && <i>{side}</i>}

	</>) : null;

}
