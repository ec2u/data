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
 * Mutual exclusion primitive for coordinating asynchronous operations.
 *
 * Ensures that only one task executes at a time, even when multiple tasks
 * are queued concurrently. Tasks are executed in FIFO order.
 */
export interface Mutex {

	/**
	 * Executes a task with exclusive access.
	 *
	 * Waits for any previously queued tasks to complete before executing.
	 * The mutex is properly released even if the task throws an error.
	 *
	 * @typeParam T The type of value returned by the task
	 *
	 * @param task The function to execute with exclusive access
	 *
	 * @returns A promise that resolves to the task's return value
	 */
	execute<T>(task: () => T | Promise<T>): Promise<T>;

}

/**
 * Creates a mutual exclusion primitive for coordinating asynchronous operations.
 *
 * @example
 *
 * ```typescript
 * const mutex = Mutex();
 *
 * await mutex.execute(async () => { // prevents race conditions in read-modify-write operations
 *
 *   await writeCounter(await readCounter() + 1);
 *
 * });
 * ```
 *
 * @returns A mutex instance that serializes task execution in FIFO order
 */
export function Mutex(): Mutex {

	let next: Promise<void> = Promise.resolve();

	return {

		async execute<T>(task: () => T | Promise<T>): Promise<T> {

			let unlock!: (value: void) => void;

			const prev = next;

			next = new Promise<void>(resolve => { unlock = resolve; });

			await prev;

			try {

				return await task();

			} finally {

				unlock();

			}

		}

	};

}
