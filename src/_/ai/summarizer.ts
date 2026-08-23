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
 * @module
 */

import type { Page } from "@/pages/index.js";
import { Awaitable } from "@metreeca/core/async";


/**
 * Generator of web page summaries.
 *
 * Abstracts over the way a summary is produced, for instance an LLM-generated abstract or an excerpt of the page
 * itself, so that consumers requiring a short description of a page aren't bound to a specific provider.
 */
export interface Summarizer {

	/**
	 * Summarises a web page.
	 *
	 * @param page The title and markdown content of the {@link Page} to be summarised
	 *
	 * @returns The summary generated for `page`, reported either directly or on completion of the generation
	 */
	(page: Pick<Page,  "title" | "content">): Awaitable<string>; // !!! remove Page dependency

}
