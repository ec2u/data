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
 * @module log
 *
 * Structured logging utilities with consistent formatting and context-based organization.
 *
 * Provides a unified logging interface that formats messages with visual prefixes and
 * context padding for improved readability in console output.
 */

import { immutable, isError, isNumber } from "@metreeca/core";


/**
 * Structured logging interface with consistent formatting.
 *
 * All log methods accept a context string (typically module or function name)
 * and a message string. Output is formatted for improved console readability.
 */
export const log=immutable({

	/**
	 * Logs debug information.
	 *
	 * @param context Module or function name
	 * @param message Descriptive message with key details
	 */
	debug(context: string, message: string): void {
		report(console.debug, "?", context, message);
	},

	/**
	 * Logs general information.
	 *
	 * @param context Module or function name
	 * @param message Descriptive message with key details
	 */
	info(context: string, message: string): void {
		report(console.info, "!", context, message);
	},

	/**
	 * Logs warnings.
	 *
	 * @param context Module or function name
	 * @param message Descriptive message with key details
	 */
	warn(context: string, message: string): void {
		report(console.warn, "!!", context, message);
	},

	/**
	 * Logs errors.
	 *
	 * @param context Module or function name
	 * @param message Descriptive message with key details
	 */
	error(context: string, message: string): void {
		report(console.error, "!!!", context, message);
	}

});


function report(
	level: (message?: any, ...optionalParams: any[]) => void,
	prefix: string,
	context: string,
	message: string
) {
	level("%s %s %s",
		prefix.padStart(3),
		context.padEnd(15),
		message
	);
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Extracts a readable message string from an unknown value.
 *
 * Safely converts Error objects to their message property or any other
 * value to its string representation. Useful for consistent error logging.
 *
 * @param value Unknown value to extract message from
 *
 * @returns Error message or string representation of the value
 */
export function message(value: unknown) {
	return isNumber(value) ? value.toLocaleString("en-US")
		: isError(value) ? value.message
			: String(value);
}

/**
 * Executes a task and monitors its execution time.
 *
 * <p>Supports both synchronous and asynchronous tasks. For promises, the elapsed time
 * is measured from task invocation until promise resolution. The monitor callback receives
 * the unwrapped result value and elapsed time in milliseconds.</p>
 *
 * @param task Function returning a value or promise to be timed
 * @param monitor Callback invoked with the result value and elapsed time in milliseconds
 *
 * @returns The task's return value (promise or direct value)
 */
export function time<T>(task: () => Promise<T>, monitor: (value: T, elapsed: number) => void): Promise<T>;
export function time<T>(task: () => T, monitor: (value: T, elapsed: number) => void): T;
export function time<T>(task: () => T | Promise<T>, monitor: (value: T, elapsed: number) => void): T | Promise<T> {

	const start=Date.now();

	const value=task();

	if ( value instanceof Promise ) {

		return value.then(resolved => {

			monitor(resolved, Date.now()-start);

			return resolved;

		});

	} else {

		monitor(value, Date.now()-start);

		return value;

	}

}
