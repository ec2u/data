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

import { Mark } from "@metreeca/tile-cell/mark";
import { Stack } from "@metreeca/tile-hive/stack";
import type { ComponentChildren } from "preact";
import "./sections.css";
import { Text } from "./text.js";


/**
 * Renders the labelled blocks of a resource description.
 *
 * @param contents The content of each block, keyed by block label; blocks with no content are left out
 *
 * @returns A stack of blocks, each its label over its content, in the order `contents` lists them, or nothing if no
 *     block states any content
 */
export function blocks(contents: Readonly<Record<string, ComponentChildren>>): ComponentChildren {

	const stated = Object.entries(contents).filter(([, content]) => content);

	return stated.length > 0 ? <Stack space={"spacing100"}>{stated.map(([label, content]) =>

		<Stack key={label} space={"spacing050"}>
			<Text look={"label"}>{label}</Text>
			{content}
		</Stack>

	)}</Stack> : undefined;

}

/**
 * Renders the long-form sections of a resource description.
 *
 * @param texts The Markdown text of each section, keyed by section label; sections with no text are left out
 *
 * @returns A stack of sections, each its label over its rendered text, in the order `texts` lists them
 */
export function sections(texts: Readonly<Record<string, undefined | string>>): ComponentChildren {
	return blocks(Object.fromEntries(Object.entries(texts).map(([label, text]) =>
		[label, text && <Mark>{text}</Mark>]
	)));
}
