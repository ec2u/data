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
import { type ComponentChildren, createElement } from "preact";
import "./card.css";


/**
 * Creates a clamped summary card.
 *
 * Sets the title over the description in a main column, and the badge over the image in a side column at the end of
 * the card. The description is cut short with an ellipsis past the given number of lines, and the image stretches to
 * the height of the lines shown, so a run of cards keeps text and image ending together.
 *
 * Empty parts are left out, and a card left with none renders nothing.
 */
export function Card({

	lines = 3,

	title,
	badge,
	image,

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
	 * The badge classifying the item, at the top of the side column across from the title, kept to one line.
	 */
	badge?: ComponentChildren

	/**
	 * The image standing for the item, under the badge in the side column, stretched to the height of the description.
	 */
	image?: ComponentChildren


	/**
	 * The description of the item, under the title in the main column, clamped to `lines`.
	 */
	children?: ComponentChildren

}) {

	return [title, badge, image, children].some(isContent) ? createElement("ec2u-card", { style: { "--ec2u-card-lines": lines } }, <>

		{isContent(title) && <span>{title}</span>}
		{isContent(badge) && <span class="badge">{badge}</span>}

		{isContent(children) && <div>{children}</div>}

		{isContent(image) && <i>{image}</i>}

	</>) : null;

}
