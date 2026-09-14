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
 * Delegate disposal.
 *
 * @module
 *
 * @see {@link https://tc39.es/proposal-explicit-resource-management/ ECMAScript Explicit Resource Management}
 */

import type { Awaitable } from "@metreeca/core/async";


/**
 * Value taking part in a disposal protocol.
 */
export type Releasable = {

	readonly [Symbol.asyncDispose]?: () => Awaitable<void>
	readonly [Symbol.dispose]?: () => void

}


/////////////////////////////////////////////////// ////////////////////////////////////////////////////////////////////

/**
 * Disposes a delegate.
 *
 * Releases whatever the delegate holds under either disposal protocol, the asynchronous one taking precedence where
 * both are exposed, as the executor of a job does; a delegate taking part in neither is left as it is, which is not an
 * error.
 *
 * @param delegate The delegate to be disposed
 *
 * @returns A promise settling as `delegate` is released
 *
 * @typeParam T The type of the delegate to be disposed
 */
export async function dispose<T>(delegate: T & Releasable): Promise<void> {

	const releaseAsync = delegate[Symbol.asyncDispose];
	const release = delegate[Symbol.dispose];

	if ( releaseAsync !== undefined ) {

		await releaseAsync.call(delegate);

	} else if ( release !== undefined ) {

		release.call(delegate);

	}

}
