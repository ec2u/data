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

import { pipe, type Task } from "@metreeca/flow";
import { filter, map, tee } from "@metreeca/flow/tasks";


export function when<V>(
	test: (value: NoInfer<V>) => boolean,
	pass: Task<NoInfer<V>>
): Task<V>

export function when<V, R>(
	test: (value: NoInfer<V>) => boolean,
	pass: Task<NoInfer<V>, R>,
	fail: Task<NoInfer<V>, R>
): Task<V, R>

export function when<V>(
	test: (value: V) => boolean,
	pass: Task<V>,
	fail: Task<V> = feed => feed
): Task<V> {

	return feed => pipe(feed
		(map(value => ({ value, test: test(value) })))
		(tee(
			routed => pass(routed
				(filter(item => item.test))
				(map(item => item.value))
			),
			routed => fail(routed
				(filter(item => !item.test))
				(map(item => item.value))
			)
		))
	);

}
