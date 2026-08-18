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
 * Asynchronous processing utilities.
 *
 * @module
 */

/**
 * A possibly asynchronous value.
 *
 * A value reported either directly or as a promise, so that consumers await it uniformly without forcing every
 * provider to be asynchronous.
 *
 * @typeParam T The type of the reported value
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await | MDN await}
 */
export type Awaitable<T> = T | PromiseLike<T>
