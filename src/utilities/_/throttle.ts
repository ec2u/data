/*
 * Copyright © 2020-2025 EC2U Alliance
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
 * Configuration options for creating a throttle instance.
 */
export interface ThrottleOptions {
	/**
	 * The minimum delay between task executions in milliseconds.
	 * @default 0
	 */
	minimum?: number;

	/**
	 * The maximum delay between task executions in milliseconds; 0 means no limit.
	 * @default 0
	 */
	maximum?: number;

	/**
	 * The exponential factor for queue-based delay increases (must be >= 1.0).
	 * Higher values cause more aggressive slowdown as concurrent tasks increase.
	 * @default 1
	 */
	buildup?: number;

	/**
	 * The multiplicative factor for increasing delays on task failure (must be >= 1.0).
	 * Values > 1.0 implement exponential backoff on failures.
	 * @default 1
	 */
	backoff?: number;

	/**
	 * The multiplicative factor for decreasing delays on task success (must be between 0.0 and 1.0).
	 * Values < 1.0 allow the throttle to speed up after successful completions.
	 * @default 1
	 */
	recover?: number;
}

/**
 * A throttle instance for rate-limiting concurrent task execution.
 */
export interface Throttle<T = unknown> {
	/**
	 * Waits for permission to execute a task, respecting throttling constraints.
	 *
	 * Blocks (asynchronously) until the throttle determines it's safe to proceed based on
	 * current load and timing. Uses randomized sleep intervals to avoid thundering herd effects.
	 *
	 * @param adapt - If true, increments the queue counter and expects completion feedback through
	 *                the {@link adapt} method. Defaults to true.
	 * @returns A promise that resolves with the time elapsed since the last task execution in milliseconds
	 */
	await(adapt?: boolean): Promise<number>;

	/**
	 * Adapts throttling parameters based on task completion status.
	 *
	 * Decrements the queue counter and adjusts the baseline delay:
	 * - On successful completion: reduces delay by the recover factor (speeds up) and clears failure state
	 * - On failure/retry: increases delay by the backoff factor (slows down) and sets failure state
	 *
	 * The delay is always clamped between minimum and maximum bounds, with retry delays taking
	 * precedence when specified. After a failure, the throttle restricts new tasks until the current one succeeds.
	 *
	 * @param completed - True if the task completed successfully, false if it failed
	 * @returns The new baseline delay in milliseconds
	 */
	adapt(completed: boolean): number;

	/**
	 * Adapts throttling parameters with an explicit retry delay.
	 *
	 * @param retry - The explicit retry delay in milliseconds; 0 indicates successful task completion
	 * @returns The new baseline delay in milliseconds
	 * @throws Error if retry is negative
	 */
	adapt(retry: number): number;

	/**
	 * Applies throttling to a value by waiting without affecting the queue counter.
	 *
	 * This allows the throttle to be used in functional programming contexts where rate
	 * limiting is needed. The value is passed through unchanged after the throttling delay.
	 *
	 * @param value - The input value to pass through
	 * @returns A promise that resolves with the same value after applying throttling delay
	 */
	apply<V extends T>(value: V): Promise<V>;

	/**
	 * Creates a new throttle instance with updated minimum delay.
	 *
	 * @param minimum - The minimum delay in milliseconds
	 * @returns A new throttle instance with the updated minimum delay
	 * @throws Error if minimum is negative or greater than maximum
	 */
	withMinimum(minimum: number): Throttle<T>;

	/**
	 * Creates a new throttle instance with updated maximum delay.
	 *
	 * @param maximum - The maximum delay in milliseconds; 0 means no limit
	 * @returns A new throttle instance with the updated maximum delay
	 * @throws Error if maximum is negative or less than minimum
	 */
	withMaximum(maximum: number): Throttle<T>;

	/**
	 * Creates a new throttle instance with updated buildup factor.
	 *
	 * @param buildup - The exponential factor for delay increases based on queue size (must be >= 1.0)
	 * @returns A new throttle instance with the updated buildup factor
	 * @throws Error if buildup is less than 1.0
	 */
	withBuildup(buildup: number): Throttle<T>;

	/**
	 * Creates a new throttle instance with updated backoff factor.
	 *
	 * @param backoff - The multiplicative factor for delay increases (must be >= 1.0)
	 * @returns A new throttle instance with the updated backoff factor
	 * @throws Error if backoff is less than 1.0
	 */
	withBackoff(backoff: number): Throttle<T>;

	/**
	 * Creates a new throttle instance with updated recovery factor.
	 *
	 * @param recover - The multiplicative factor for delay decreases (must be between 0.0 and 1.0)
	 * @returns A new throttle instance with the updated recovery factor
	 * @throws Error if recover is not between 0.0 and 1.0
	 */
	withRecover(recover: number): Throttle<T>;
}

/**
 * Clamps a value between a minimum and maximum.
 */
function clamp(value: number, min: number, max: number): number {
	return Math.min(Math.max(value, min), max);
}

/**
 * Sleeps for a random duration to avoid thundering herd effects.
 */
function randomSleep(baseMs: number): Promise<void> {
	const jitter = Math.floor(Math.random() * baseMs);
	return new Promise(resolve => setTimeout(resolve, baseMs + jitter));
}

/**
 * Validates throttle configuration parameters.
 */
function validateOptions(
	minimum: number,
	maximum: number,
	buildup: number,
	backoff: number,
	recover: number
): void {
	if (minimum < 0) {
		throw new Error(`negative minimum delay <${minimum}>`);
	}

	if (maximum < 0) {
		throw new Error(`negative maximum delay <${maximum}>`);
	}

	if (maximum > 0 && minimum > maximum) {
		throw new Error(`conflicting minimum <${minimum}> and maximum <${maximum}> delays`);
	}

	if (buildup < 1.0) {
		throw new Error(`illegal buildup factor <${buildup.toFixed(3)}>`);
	}

	if (backoff < 1.0) {
		throw new Error(`illegal backoff factor <${backoff.toFixed(3)}>`);
	}

	if (recover < 0 || recover > 1.0) {
		throw new Error(`illegal recover factor <${recover.toFixed(3)}>`);
	}
}

/**
 * Creates an adaptive throttle for rate-limiting concurrent task execution.
 *
 * Implements exponential backoff and recovery mechanisms to dynamically adjust execution
 * rates based on load and success rates.
 *
 * @example
 * ```typescript
 * // Create a throttle with 100ms minimum delay and 2x backoff on failure
 * const throttle = createThrottle({
 *   minimum: 100,
 *   backoff: 2.0,
 *   recover: 0.5
 * });
 *
 * // Use in an async operation
 * async function processItem(item: string) {
 *   await throttle.await();
 *   try {
 *     // Do work
 *     throttle.adapt(true); // success
 *   } catch (error) {
 *     throttle.adapt(false); // failure
 *   }
 * }
 *
 * // Or use as a function operator
 * const items = ['a', 'b', 'c'];
 * for (const item of items) {
 *   await throttle.apply(item);
 *   // Process item
 * }
 * ```
 *
 * @param options - Configuration options for the throttle
 * @returns A throttle instance for rate-limiting operations
 * @throws Error if any parameter validation fails
 */
export function createThrottle<T = unknown>(options: ThrottleOptions = {}): Throttle<T> {
	// Extract and validate options
	const minimum = options.minimum ?? 0;
	const maximum = options.maximum ?? 0;
	const buildup = options.buildup ?? 1;
	const backoff = options.backoff ?? 1;
	const recover = options.recover ?? 1;

	validateOptions(minimum, maximum, buildup, backoff, recover);

	// Internal state
	const state = {
		minimum,
		maximum: maximum === 0 ? Number.MAX_SAFE_INTEGER : maximum,
		buildup,
		backoff,
		recover,
		dirty: false, // true if the last response was a rejection, restricting pending tasks to 1
		delay: minimum, // the current baseline delay between two task executions (ms)
		fence: Date.now(), // the timestamp of the last task execution (ms since epoch)
		queue: 0, // the number of active tasks
		mutex: Promise.resolve(), // simple mutex for synchronization
	};

	/**
	 * Attempts to reserve an execution slot, respecting throttling constraints.
	 *
	 * Uses exponential backoff based on queue size: more concurrent tasks result in longer delays.
	 * After a failure, only allows one request at a time until a success occurs.
	 * If successful, atomically updates the fence timestamp and optionally increments the queue counter.
	 *
	 * @param adapt - True to increment the queue counter, false to leave it unchanged
	 * @returns The time elapsed since the last task execution in milliseconds, or a negative value
	 *          if the caller should wait
	 */
	function tryDelay(adapt: boolean): number {
		const next = Date.now();
		const wait = clamp(
			Math.round(state.delay * Math.pow(state.buildup, state.queue)),
			state.minimum,
			state.maximum
		);

		if ((state.dirty && state.queue > 0) || state.fence + wait > next) {
			return -1;
		} else {
			const last = state.fence;
			state.fence = next;

			if (adapt) {
				state.queue++;
			}

			return next - last;
		}
	}

	/**
	 * Adapts the throttling parameters based on task completion status (internal implementation).
	 */
	function adaptInternal(completed: boolean, retry: number): number {
		state.dirty = !completed;
		state.queue--;

		state.delay = Math.max(
			retry,
			completed
				? Math.max(Math.round(state.delay * state.recover), state.minimum)
				: Math.min(Math.round(state.delay * state.backoff), state.maximum)
		);

		return state.delay;
	}

	/**
	 * Executes a function with mutual exclusion.
	 */
	async function synchronized<R>(fn: () => R): Promise<R> {
		const release = state.mutex;
		let resolve: () => void;
		state.mutex = new Promise(r => (resolve = r));

		await release;
		try {
			return fn();
		} finally {
			resolve!();
		}
	}

	// Public API
	return {
		async await(adapt: boolean = true): Promise<number> {
			let elapsed: number;

			while ((elapsed = await synchronized(() => tryDelay(adapt))) < 0) {
				await randomSleep(state.minimum);
			}

			return elapsed;
		},

		adapt(completedOrRetry: boolean | number): number {
			if (typeof completedOrRetry === 'number') {
				const retry = completedOrRetry;
				if (retry < 0) {
					throw new Error(`negative delay <${retry}>`);
				}
				return adaptInternal(retry === 0, retry);
			} else {
				return adaptInternal(completedOrRetry, 0);
			}
		},

		async apply<V extends T>(value: V): Promise<V> {
			await this.await(false);
			return value;
		},

		withMinimum(newMinimum: number): Throttle<T> {
			return createThrottle({
				minimum: newMinimum,
				maximum: state.maximum === Number.MAX_SAFE_INTEGER ? 0 : state.maximum,
				buildup: state.buildup,
				backoff: state.backoff,
				recover: state.recover,
			});
		},

		withMaximum(newMaximum: number): Throttle<T> {
			return createThrottle({
				minimum: state.minimum,
				maximum: newMaximum,
				buildup: state.buildup,
				backoff: state.backoff,
				recover: state.recover,
			});
		},

		withBuildup(newBuildup: number): Throttle<T> {
			return createThrottle({
				minimum: state.minimum,
				maximum: state.maximum === Number.MAX_SAFE_INTEGER ? 0 : state.maximum,
				buildup: newBuildup,
				backoff: state.backoff,
				recover: state.recover,
			});
		},

		withBackoff(newBackoff: number): Throttle<T> {
			return createThrottle({
				minimum: state.minimum,
				maximum: state.maximum === Number.MAX_SAFE_INTEGER ? 0 : state.maximum,
				buildup: state.buildup,
				backoff: newBackoff,
				recover: state.recover,
			});
		},

		withRecover(newRecover: number): Throttle<T> {
			return createThrottle({
				minimum: state.minimum,
				maximum: state.maximum === Number.MAX_SAFE_INTEGER ? 0 : state.maximum,
				buildup: state.buildup,
				backoff: state.backoff,
				recover: newRecover,
			});
		},
	};
}
