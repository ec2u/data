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

import { isBoolean } from "@metreeca/core";
import { Mutex } from "./mutex";
import { sleep } from "./sleep";


const pollLower = 0.1;  // poll at minimum 10% of effective delay
const pollUpper = 0.2;  // poll at maximum 20% of effective delay


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Adaptive throttle for rate-limiting concurrent task execution.
 *
 * Provides an intelligent throttling mechanism that dynamically adjusts execution rates based on
 * system load and task success/failure patterns. Implements exponential backoff on failures,
 * recovery on successes, and queue-based delay scaling to prevent overload.
 */
export interface Throttle {

	/**
	 * Waits for permission to execute a task, respecting throttling constraints.
	 *
	 * Blocks (asynchronously) until the throttle determines it's safe to proceed based on
	 * current load and timing. Uses randomized sleep intervals to avoid thundering herd effects.
	 *
	 * @param adapt - If true, increments the queue counter and expects completion feedback through
	 *                the {@link adapt} method. Defaults to false.
	 *
	 * @returns A promise that resolves with the time elapsed since the last task execution in milliseconds
	 */
	queue(adapt?: boolean): Promise<number>;

	/**
	 * Applies throttling to a value by waiting without affecting the queue counter.
	 *
	 * This allows the throttle to be used in functional programming contexts where rate
	 * limiting is needed. The value is passed through unchanged after the throttling delay.
	 *
	 * **Warning:** This overload does NOT handle `undefined` or `boolean` values.
	 * Those are handled by {@link queue(adapt?: boolean)} instead, which returns
	 * elapsed time rather than passing through the value.
	 *
	 * @param value - The input value to pass through (must not be `undefined` or `boolean`)
	 *
	 * @returns A promise that resolves with the same value after applying throttling delay
	 */
	queue<V>(value: V): Promise<V>;


	/**
	 * Adapts throttling parameters based on task completion status.
	 *
	 * Decrements the queue counter and adjusts the baseline delay:
	 *
	 * - On successful completion: reduces delay by the recover factor (speeds up) and clears failure state
	 * - On failure/retry: increases delay by the backoff factor (slows down) and sets failure state
	 *
	 * The delay is always clamped between minimum and maximum bounds, with retry delays taking
	 * precedence when specified. After a failure, the throttle restricts new tasks until the current one succeeds.
	 *
	 * @param completed - True if the task completed successfully, false if it failed
	 *
	 * @returns A promise that resolves to the new baseline delay in milliseconds
	 */
	adapt(completed: boolean): Promise<number>;

	/**
	 * Adapts throttling parameters with an explicit retry delay.
	 *
	 * @param retry - The explicit retry delay in milliseconds; 0 indicates successful task completion
	 *
	 * @returns A promise that resolves to the new baseline delay in milliseconds
	 *
	 * @throws Error if retry is negative
	 */
	adapt(retry: number): Promise<number>;


	/**
	 * Executes a function with retry logic using this throttle.
	 *
	 * @param task Function to execute (synchronous or asynchronous)
	 * @param attempts Maximum retry attempts (`0` = unlimited retries, default: `0`)
	 * @param recover Callback to determine if an error is retryable and extract API-specified delay.
	 *                Returns `undefined` for non-retryable errors, or a delay in milliseconds for retryable errors
	 *                (`0` = use default backoff, `>0` = use API-specified delay)
	 * @param monitor Optional callback invoked before each attempt with current attempt (zero-indexed),
	 *                maximum attempts, and elapsed time since retry started.
	 *                Elapsed time is `undefined` when task fails (non-retryable error or max attempts exhausted),
	 *                or time in milliseconds when task is about to execute or will retry after error
	 *
	 * @returns Promise resolving to the result of the executed task
	 *
	 * @throws Re-throws the error from `task` when retrying stops, either because `recover` returns
	 *         `undefined` (non-retryable error) or maximum retry attempts are exceeded
	 *
	 * @remarks
	 *
	 * **Warning**: Setting `attempts = 0` creates an **infinite retry loop** that only terminates
	 * when the task succeeds or a non-retryable error occurs (when `recover` returns `undefined`).
	 * Use with caution in production code.
	 *
	 * **Note**: Attempt numbers are zero-indexed. The first execution is attempt 0,
	 * the second is attempt 1, and so on. When `attempts = N`, the loop runs attempts 0 through N-1.
	 */
	retry<T>(task: () => T | Promise<T>, {

		attempts,

		recover,
		monitor

	}?: {

		attempts?: number

		recover?: (error: unknown) => undefined | number
		monitor?: (attempt: number, attempts: number, elapsed: undefined | number) => void

	}): Promise<T>;

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates an adaptive throttle for rate-limiting concurrent task execution.
 *
 * The throttle combines two independent delay mechanisms:
 *
 * - **Queue-based scaling** (buildup): Increases delays exponentially based on concurrent task count
 *   (effective_delay = delay × buildup^queue). This prevents overload when many tasks queue up.
 * - **Adaptive adjustment** (backoff/recover): Modifies the baseline delay based on task outcomes.
 *   Failures trigger backoff (delay × backoff), successes trigger recovery (delay × recover).
 *
 * These mechanisms work together: buildup provides immediate load-based throttling, while
 * backoff/recover adapt the baseline rate based on system feedback over time.
 *
 * @example
 *
 * ```typescript
 * const throttle = Throttle({ minimum: 100, backoff: 2.0, recover: 0.5 });
 *
 * await throttle.queue(true);
 *
 * try {
 *   await processItem();
 *   await throttle.adapt(true);
 * } catch (error) {
 *   await throttle.adapt(false);
 * }
 * ```
 *
 * @param minimum The minimum delay between task executions in milliseconds; must be non-negative
 * @param maximum The maximum delay between task executions in milliseconds; `0` means no limit
 * @param buildup The exponential factor for queue-based delay increases; must be >= 1.0
 * @param backoff The multiplicative factor for increasing delays on task failure; must be >= 1.0
 * @param recover The multiplicative factor for decreasing delays on task success; must be 0.0-1.0
 *
 * @returns A throttle instance for rate-limiting operations
 *
 * @throws Error if any parameter validation fails
 */
export function Throttle({

	minimum = 0,
	maximum = 0,

	buildup = 1,
	backoff = 1,
	recover = 1

}: {

	minimum?: number;
	maximum?: number;

	buildup?: number;
	backoff?: number;
	recover?: number;

} = {}): Throttle {

	if ( minimum < 0 ) {
		throw new Error(`negative minimum delay <${minimum}>`);
	}

	if ( maximum < 0 ) {
		throw new Error(`negative maximum delay <${maximum}>`);
	}

	if ( maximum > 0 && minimum > maximum ) {
		throw new Error(`conflicting minimum <${minimum}> and maximum <${maximum}> delays`);
	}


	if ( buildup < 1.0 ) {
		throw new Error(`illegal buildup factor <${buildup.toFixed(3)}>`);
	}

	if ( backoff < 1.0 ) {
		throw new Error(`illegal backoff factor <${backoff.toFixed(3)}>`);
	}

	if ( recover < 0 || recover > 1.0 ) {
		throw new Error(`illegal recover factor <${recover.toFixed(3)}>`);
	}


	const ceiling = maximum === 0 ? Number.MAX_SAFE_INTEGER : maximum;


	let dirty = false; // true if the last response was a rejection; restricting pending tasks to 1
	let delay = minimum; // the current baseline delay between two task executions (ms)
	let fence = Date.now(); // the timestamp of the last task execution (ms since epoch)
	let count = 0; // the number of active tasks

	const mutex = Mutex();


	/**
	 * Clamps a value between a minimum and maximum.
	 */
	function clamp(value: number, min: number, max: number): number {
		return Math.min(Math.max(value, min), max);
	}


	return {

		async queue(input?: unknown): Promise<any> {

			// queue(adapt?: boolean): returns elapsed time
			// queue<V>(value: V): returns the value after throttling

			const adapting = input === undefined || isBoolean(input);
			const adapt = input === true; // increment counter only when queue(true) is called

			// poll until permission granted, using adaptive intervals to reduce contention.

			let result: number;

			while ( (result = await mutex.execute(() => {

				// attempt to reserve an execution slot, respecting throttling constraints.
				// after failure, only allows one task at a time until success occurs.

				const next = Date.now();
				const wait = clamp(
					Math.round(delay*Math.pow(buildup, count)),
					minimum,
					ceiling
				);

				if ( (dirty && count > 0) || fence+wait > next ) {

					return -wait; // wait required (return negative effective delay)

				} else {

					const last = fence;

					fence = next;

					if ( adapt ) {
						count++;
					}

					return next-last; // Time elapsed since last execution

				}

			})) < 0 ) {

				const effective = -result; // extract the effective delay from the negative result

				// poll frequency scales with effective delay (10-20% with jitter to avoid thundering herd),
				// minimizing mutex contention and CPU usage under heavy load or sustained failures.

				const baseline = clamp(
					Math.round(effective*(pollLower+Math.random()*(pollUpper-pollLower))),
					minimum,
					ceiling
				);

				await sleep(baseline+Math.floor(Math.random()*baseline));
			}

			return adapting ? result : input;

		},

		async adapt(input: boolean | number): Promise<number> {

			// adapt(completed: boolean): adaptive delay adjustment
			// adapt(retry: number): explicit retry delay (0 = success)

			const completed = isBoolean(input) ? input : input === 0;
			const retry = isBoolean(input) ? 0 : input;

			if ( retry < 0 ) {
				throw new Error(`negative delay <${retry}>`);
			}

			// adapt throttling parameters based on task completion status

			return mutex.execute(() => {

				dirty = !completed;
				count--;

				delay = Math.max(retry, completed
					? Math.max(Math.round(delay*recover), minimum)
					: Math.min(Math.round(delay*backoff), ceiling)
				);

				return delay;

			});

		},

		async retry<T>(task: () => T | Promise<T>, {

			attempts = 0,

			recover,
			monitor

		}: {

			attempts?: number

			recover?: (error: unknown) => undefined | number
			monitor?: (attempt: number, attempts: number, elapsed: undefined | number) => void

		} = {}): Promise<T> {

			const start = Date.now();

			// noinspection ForLoopThatDoesntUseLoopVariableJS

			for (let attempt = 0; true; attempt++) {
				try {

					await this.queue(true);

					monitor?.(attempt, attempts, Date.now()-start);

					const result = await task();

					await this.adapt(true);

					return result;

				} catch ( error ) {

					const delay = recover?.(error);

					if ( delay === undefined // non-retryable error
						|| (attempts > 0 && attempt+1 >= attempts) // no more attempts remaining
					) {

						await this.adapt(false);

						monitor?.(attempt, attempts, undefined);

						throw error;

					} else { // retries remaining

						if ( delay > 0 ) {
							await this.adapt(delay);
						} else {
							await this.adapt(false);
						}

						monitor?.(attempt, attempts, Date.now()-start);

					}

				}
			}

		}

	};

}
