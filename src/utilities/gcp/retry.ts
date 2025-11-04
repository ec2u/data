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

import { log } from "@/utilities/core/log";
import { ApiError } from "@google/genai";

/**
 * Options for retry behavior.
 */
export interface RetryOptions {
	/**
	 * Maximum number of retry attempts (default: 5)
	 */
	maxRetries?: number;

	/**
	 * Initial delay in milliseconds (default: 1000)
	 */
	initialDelay?: number;

	/**
	 * Maximum delay in milliseconds (default: 60000 - 1 minute)
	 */
	maxDelay?: number;

	/**
	 * Backoff multiplier (default: 2)
	 */
	backoffMultiplier?: number;

	/**
	 * Name for logging purposes
	 */
	name?: string;
}

/**
 * Checks if an error is a rate limit error (429 status code).
 *
 * @param error Error to check
 *
 * @returns True if error is a rate limit error
 */
export function isRateLimitError(error: unknown): boolean {
	return error instanceof ApiError && error.status === 429;
}

/**
 * Extracts retry delay from API error details.
 *
 * The Gemini API includes RetryInfo in 429 error responses with the recommended delay.
 *
 * @param error ApiError with potential RetryInfo
 *
 * @returns Delay in milliseconds, or undefined if not found
 */
export function extractRetryDelay(error: unknown): number | undefined {
	if ( !(error instanceof ApiError) ) {
		return undefined;
	}

	// Check multiple possible locations for details
	const details = (error as any).details ?? (error as any).error?.details;

	if ( !Array.isArray(details) ) {
		return undefined;
	}

	const retryInfo = details.find((d: any) =>
		d["@type"]?.includes("RetryInfo")
	);

	if ( !retryInfo?.retryDelay ) {
		return undefined;
	}

	// Parse duration string like "46s" or "46.745947355s"
	const delayStr = retryInfo.retryDelay;
	const match = delayStr.match(/^(\d+(?:\.\d+)?)s$/);

	if ( match ) {
		return Math.ceil(parseFloat(match[1])*1000);
	}

	return undefined;
}

/**
 * Sleep for specified milliseconds.
 *
 * @param ms Milliseconds to sleep
 */
export function sleep(ms: number): Promise<void> {
	return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Wraps an async function with retry logic and exponential backoff.
 *
 * Automatically retries on rate limit errors (429) with jittered exponential backoff.
 * Uses retry delay from API when available, otherwise uses exponential backoff.
 *
 * @typeParam T Return type of the wrapped function
 *
 * @param fn Async function to wrap
 * @param options Retry configuration options
 *
 * @returns Result of the function call
 *
 * @throws Original error if max retries exceeded or non-retryable error
 *
 * @example
 * ```typescript
 * const response = await withRetry(
 *   () => ai.models.generateContent({ model: "gemini-2.5-flash", contents: "test" }),
 *   { name: "generateContent" }
 * );
 * ```
 */
export async function withRetry<T>(
	fn: () => Promise<T>,
	options: RetryOptions = {}
): Promise<T> {
	const {
		maxRetries = 5,
		initialDelay = 1000,
		maxDelay = 60000,
		backoffMultiplier = 2,
		name = "operation"
	} = options;

	let attempt = 0;
	let delay = initialDelay;

	while ( true ) {
		try {
			return await fn();

		} catch ( error ) {
			attempt++;

			// Only retry rate limit errors
			if ( !isRateLimitError(error) ) {
				throw error;
			}

			// Check if we've exhausted retries
			if ( attempt > maxRetries ) {
				log.error(name, `max retries (${maxRetries}) exceeded`);
				throw error;
			}

			// Get retry delay from API or use exponential backoff
			const apiDelay = extractRetryDelay(error);

			let actualDelay: number;

			if ( apiDelay ) {
				// API provided explicit delay - use it directly (no jitter)
				actualDelay = apiDelay;
			} else {
				// Use exponential backoff with jitter to prevent thundering herd
				const jitter = delay*(0.5+Math.random());
				actualDelay = Math.min(jitter, maxDelay);
			}

			log.warn(
				name,
				`rate limit hit (attempt ${attempt}/${maxRetries}), retrying in ${Math.round(actualDelay/1000)}s`+
				(apiDelay ? " (API-specified delay)" : "")
			);

			await sleep(actualDelay);

			// Update delay for next attempt (only for exponential backoff)
			if ( !apiDelay ) {
				delay = Math.min(delay*backoffMultiplier, maxDelay);
			}
		}
	}
}
