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

import { immutable } from "@metreeca/core/structures";
import type { Store } from "@metreeca/keep";


/**
 * Creates a store discarding every mutation.
 *
 * Stands in for a connector while one is being wired, so that a job exercising the whole pipeline reports what it
 * would store without a backend to store it in.
 *
 * @returns An immutable {@link Store} retrieving nothing, reporting every mutation as applied and notifying no
 *          observer
 */
export function createMockStore(): Store {

	const store: Store = immutable({

		lookup: async () => undefined,

		create: async () => undefined,
		update: async () => undefined,
		delete: async () => undefined,

		insert: async ({ entry }) => entry,
		remove: async ({ entry }) => entry,

		observe: () => () => undefined,
		execute: async task => task(store),
		close: async () => undefined

	});

	return store;

}
