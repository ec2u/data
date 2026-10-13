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

import { GET } from "@metreeca/http";
import express, { type RequestHandler } from "express";
import { resolve } from "node:path";

/**
 * Serves a browser-based single-page application.
 *
 * Page loads (`GET` requests accepting `text/html`) receive its `index.html` whatever their path, so that client-side
 * routes survive a reload, while other requests receive its static assets or fall through to the next handler.
 *
 * @param path - The path of the folder holding the application, that is its `index.html` entry page and the static
 *   assets it loads
 *
 * @returns A handler serving the application; mount it ahead of other routes, so that page loads reach it first
 */
export function client(path: string): RequestHandler {


	// !!! Responses from the same URL differ by Accept, so send Vary: Accept. Without it,
	//  a cache could serve JSON to a browser navigation or the shell to an API call.

	const index = resolve(path, "index.html");
	const assets = express.static(path, { index: false });

	return (request, response, next) => request.method === GET && request.get("Accept")?.includes("text/html")
		? response.sendFile(index)
		: assets(request, response, next);

}
