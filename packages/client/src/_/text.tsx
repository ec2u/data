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

import type { Tokens } from "@metreeca/tile";
import { Style } from "@metreeca/tile-hive/style";
import type { ComponentChildren } from "preact";


/**
 * The design system tokens each look of a text assigns.
 */
const Looks = {

	strong: { fontWeight: "fontWeightStrong" },
	muted: { color: "colorLabel" },
	label: { color: "colorLabel", fontSize: "fontSizeSmall" }

} satisfies Readonly<Record<string, Tokens>>;


/**
 * Creates a styled text.
 *
 * Sets a run of text in one of the looks the design system offers, without adding a box of its own, so it sits in the
 * line, the row or the column around it as the bare text would.
 *
 * @param options The widget configuration
 *
 * @returns The styled text
 */
export function Text({

	look,
	children

}: {

	/**
	 * How the text reads: `strong` for emphasis, `muted` for secondary text at body size, `label` for guidance
	 * introducing the content it precedes, in the muted colour at a smaller size.
	 */
	look: keyof typeof Looks

	/**
	 * The text to be styled.
	 */
	children: ComponentChildren

}) {

	return <Style css={Looks[look]}>{children}</Style>;

}
