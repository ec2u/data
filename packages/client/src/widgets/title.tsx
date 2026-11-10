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

import { isString } from "@metreeca/core";
import { type ComponentChildren, createElement } from "preact";
import "./title.css";


/**
 * Creates the title section of a resource page.
 *
 * Opens the page body with the name of the resource as its heading, followed by its description, both wrapping around
 * the image standing for the resource, so a detail page reads as a document rather than as an entry in a list.
 *
 * @param options The widget configuration
 *
 * @returns The title section
 */
export function Title({

	title,
	image,
	caption,

	children

}: {

	/**
	 * The name of the resource, set as the heading of the page body; none if omitted, as when the page path already
	 * names the resource.
	 */
	title?: ComponentChildren

	/**
	 * The image standing for the resource, set beside the heading and the description; a string is taken as the URL of
	 * a decorative picture, left out of the accessibility tree; none if omitted.
	 */
	image?: ComponentChildren

	/**
	 * The caption of the image, such as its credits, set under it; left out with no image to stand under.
	 */
	caption?: ComponentChildren


	/**
	 * The description of the resource, under the heading.
	 */
	children?: ComponentChildren

}) {

	return createElement("ec2u-title", {}, <>

		{image && <figure>
			{isString(image) ? <img alt="" src={image}/> : image}
			{caption && <figcaption>{caption}</figcaption>}
        </figure>}

		{title && <h1>{title}</h1>}

		{children}

	</>);

}
