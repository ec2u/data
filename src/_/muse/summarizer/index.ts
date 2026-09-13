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

/**
 * Web page summarisation.
 *
 * Provides the {@link Summarizer} contract for condensing a web page into a short abstract, decoupling consumers from
 * the generation strategy.
 *
 * @module index
 */

import type { Page } from "@/units/_pages/index.js";
import type { Awaitable } from "@metreeca/core/async";


/**
 * Web page summariser.
 *
 * Condenses the title and content of a web page into a short abstract.
 */
export type Summarizer = {

	/**
	 * Summarises a web page.
	 *
	 * @param page The title and markdown content of the {@link Page} to be summarised
	 *
	 * @returns The summary of `page`, either directly or on settlement of the returned promise
	 */
	(page: Pick<Page, "title" | "content">): Awaitable<string>; // !!! remove Page dependency

};


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates the default summariser.
 *
 * Summarisation depends on an external provider, with no sensible in-process fallback: a job relying on this service
 * must bind a concrete summariser to it.
 *
 * @returns Nothing
 *
 * @throws {@link !Error Error} Always, reporting the service as undefined
 */
export function createSummarizer(): Summarizer {

	throw new Error("undefined page summarizer service");

}
