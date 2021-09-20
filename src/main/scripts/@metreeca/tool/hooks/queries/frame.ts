/*
 * Copyright © 2020-2021 Metreeca srl
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

import { Frame, Query } from "../../bases";
import { Updater } from "../index";
import { EntryUpdater, useEntry } from "./entry";


export function useFrame<F extends Frame=Frame>(
	id: string, model: F, [query, setQuery]: [Query, Updater<Query>]=[{}, () => {}]
): [
	frame: typeof model, setFrame: EntryUpdater
] {

	const [entry, setEntry]=useEntry<F>(id, model, [query, setQuery]);

	const fallback=defaults(model);

	return [entry.frame(frame => ({ ...fallback, ...frame })) || fallback, setEntry];

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Recursively replaces model fields with their default value.
 *
 * @param model
 *
 * @return
 */
function defaults(model: any): any {
	if ( typeof model === "boolean" ) {

		return false;

	} else if ( typeof model === "number" ) {

		return 0;

	} else if ( typeof model === "string" ) {

		return "";

	} else if ( Array.isArray(model) ) {

		return [];

	} else if ( typeof model === "object" ) {

		return Object.getOwnPropertyNames(model).reduce((object: any, key) => {

			object[key]=defaults((model as any)[key]);

			return object;

		}, {});

	} else {

		return model;

	}
}
