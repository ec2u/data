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

import type { ResourceShape } from "@metreeca/blue/resource";
import { type Frame, items as frames, type Slice } from "@metreeca/blue/value";
import type { Lazy } from "@metreeca/core";
import { type Feed, pipe } from "@metreeca/flow";
import { items } from "@metreeca/flow/feeds";
import { flat, map, trim } from "@metreeca/flow/tasks";
import { service } from "@metreeca/gear";
import type { StoreLookup } from "@metreeca/keep";
import { createStore } from "./index.js";


/**
 * Retrieves the items of a collection from the store as a feed.
 *
 * The request names a resource and a {@link Slice | slice} of it: a single multi-valued property and the members
 * wanted from each of its items. The feed yields those items one by one, each typed as a {@link Frame | frame} of the
 * slice, so they can enter a pipeline directly without being unwrapped from the holding resource. A resource that is
 * not in the store, or that holds no items, yields an empty feed.
 *
 * The retrieval runs against the store bound to the current execution.
 *
 * @typeParam S The shape of the resource holding the collection, possibly deferred to break definition cycles
 * @typeParam T The slice naming the collection and the members to retrieve from each item, possibly with criteria
 *
 * @param request The resource holding the collection and the slice to retrieve from it
 *
 * @returns A feed of the items in the collection, restricted to the members the slice names
 *
 * @throws {@link !Error Error} If no store is bound to the current execution
 */
export function select<
	S extends Lazy<ResourceShape>,
	T extends Slice<S, T>
>(request: StoreLookup<S, T>): Feed<Frame<S, T>> {

	const store = service(createStore);

	return pipe(
		(trim(items(store.lookup(request))))
		(flat(map(match => frames(match, request.model))))
	);

}
