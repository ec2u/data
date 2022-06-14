/*
 * Copyright © 2020-2022 Metreeca srl
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

import { DependencyList, useMemo } from "react";


/**
 * Creates a trailing handler handler.
 *
 * @param delay the length of the observation period in ms; ignored if equal to `0`
 * @param handler the delegate action handler
 * @param deps
 *
 * @returns a memoized action handler delegating to [[handler]] only those calls that were not followed by other calls
 * within [[`delay`]] ms
 *
 * @throws [[`RangeError`]] if [[`delay`]] is less than 0
 */
export function useTrailing<A extends (...args: any) => any>(
	this: any,
	delay: number, handler: A,
	deps?: DependencyList
): (...args: Parameters<typeof handler>) => void {

	if ( delay < 0 ) {
		throw new RangeError(`negative delay {${delay}}`);
	}

	return useMemo(() => {

		let timeout: number;

		return delay === 0 ? handler : (...args) => {

			clearTimeout(timeout);

			timeout=setTimeout(() => handler.apply(this, args), delay);

		};

	}, deps);

}
