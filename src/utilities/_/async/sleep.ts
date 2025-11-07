/*
 * Copyright © 2025 Metreeca srl
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
 * Asynchronously pauses execution for the specified duration.
 *
 * Non-positive delays resolve immediately without scheduling a timer.
 *
 * @param delay The duration to sleep in milliseconds
 *
 * @returns A promise that resolves after the specified delay
 */
export function sleep(delay: number): Promise<void> {
	return delay <= 0 ? Promise.resolve() : new Promise(resolve =>
		setTimeout(resolve, delay)
	);
}
