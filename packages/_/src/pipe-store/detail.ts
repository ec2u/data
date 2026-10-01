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
import type { Match, Model } from "@metreeca/blue/value";
import type { Lazy } from "@metreeca/core";
import { type Feed, pipe } from "@metreeca/flow";
import { items } from "@metreeca/flow/feeds";
import { trim } from "@metreeca/flow/tasks";
import { service } from "@metreeca/gear";
import type { StoreLookup } from "@metreeca/keep";
import { createStore } from "./index.js";

/**
 * Retrieves a resource from the store as a feed.
 *
 * The request names a resource and a {@link Model | model} of the members wanted from it. The feed yields the
 * resource once, typed as a {@link Match | match} of the model, so it can enter a pipeline directly. A resource that
 * is not in the store yields an empty feed.
 *
 * The retrieval runs against the store bound to the current execution.
 *
 * @typeParam S The shape of the resource, possibly deferred to break definition cycles
 * @typeParam T The model naming the members to retrieve from the resource
 *
 * @param request The resource to retrieve and the model to retrieve it with
 *
 * @returns A feed of the resource, restricted to the members the model names, or an empty feed if the store holds no
 * such resource
 *
 * @throws {@link !Error Error} If no store is bound to the current execution
 */
export function detail<
	S extends Lazy<ResourceShape>,
	T extends Model<S, T>
>(request: StoreLookup<S, T>): Feed<Match<S, T>> {

	const store = service(createStore);

	return pipe(
		(trim(items(store.lookup(request))))
	);

}
