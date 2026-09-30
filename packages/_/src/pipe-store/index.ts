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

import { type Store } from "@metreeca/keep";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates the default store.
 *
 * @returns Never: the store has no default
 *
 * @throws {@link !Error Error} Always, until an execution binds a connector in its place
 */
export function createStore(): Store {

	throw new Error("undefined store service");

}
