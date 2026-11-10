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

import { Markdown } from "@metreeca/clay-markdown/markdown";
import { Infobox } from "@metreeca/clay-widgets/infobox";
import { Stack } from "@metreeca/clay-widgets/stack";
import { Style } from "@metreeca/clay-widgets/style";
import { Text } from "@metreeca/clay-widgets/text";
import type { ComponentChildren } from "preact";
import "./sections.css";


/**
 * Renders the non-textual properties of a resource description, such as links, credentials and concept trees.
 *
 * @param contents The content of each property, keyed by property label; properties with no content are left out
 *
 * @returns A property panel, each label beside its content, a list of several values set one per line, in the order
 *     `contents` lists them, or nothing if no property states any content
 */
export function blocks(contents: Readonly<Record<string, ComponentChildren>>): ComponentChildren {
	return <Infobox wrap align={"end"}>{Object.fromEntries(Object.entries(contents).filter(([, content]) => content))}</Infobox>;
}

/**
 * Renders the long-form sections of a resource description.
 *
 * @param texts The Markdown text of each section, keyed by section label; sections with no text are left out
 *
 * @returns A stack of sections, each its label over its rendered text, in the order `texts` lists them, or nothing if
 *     no section states any text
 */
export function sections(texts: Readonly<Record<string, undefined | string>>): ComponentChildren {

	const stated = Object.entries(texts).flatMap(([label, text]) => text ? [{ label, text }] : []);

	return stated.length > 0 ? <Stack space={"spacing100"}>{stated.map(({ label, text }) =>

		<Stack key={label} space={"spacing050"}>
			<Style css={{ textLook: "subtle", fontSize: "fontSizeSmall" }}><Text>{label}</Text></Style>
			<Markdown>{text}</Markdown>
		</Stack>
	)}</Stack> : undefined;

}
