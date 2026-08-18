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
 * Time and duration utilities.
 *
 * @remarks
 *
 * For  complex calendrical calculations (timezone handling, calendar systems, DST-aware arithmetic),
 * consider using the Temporal API polyfills:
 *
 * - **@js-temporal/polyfill** (Official, 51.9 KB): Strict spec compliance from TC39 proposal champions
 *   ```bash
 *   npm i @js-temporal/polyfill
 *   ```
 *
 * - **temporal-polyfill** (Lightweight, 19.8 KB): 62% smaller, no BigInt dependency, near-perfect compliance
 *   ```bash
 *   npm i temporal-polyfill
 *   ```
 *
 * The Temporal API provides:
 * - Multiple calendar systems (Hebrew, Chinese, Japanese, etc.)
 * - Full IANA timezone database support with automatic DST handling
 * - Calendar-aware date arithmetic via `Temporal.Duration`
 * - Type-safe operations comparable to Java's java.time
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal | MDN Temporal API}
 * @see {@link https://tc39.es/proposal-temporal/docs/ | TC39 Temporal Proposal}
 *
 * @module
 */

/**
 * Time unit constants.
 *
 * Reports the length of commonly used time units as {@link Duration} values, for composing readable time spans by
 * multiplication. Calendar units are approximated by fixed lengths, with months taken as 30 days and years as 365.
 *
 * @example
 *
 * ```typescript
 * const timeout = 5 * duration.second;
 * const cacheExpiry = 30 * duration.day;
 * const refreshInterval = 2 * duration.hour;
 * ```
 */
export const duration = {

	second: 1000,
	minute: 60*1000,
	hour: 60*60*1000,
	day: 24*60*60*1000,
	week: 7*24*60*60*1000,
	month: 30*24*60*60*1000,
	year: 365*24*60*60*1000

} as const;


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * A point in time.
 *
 * Reports an absolute timestamp as milliseconds elapsed since the Unix epoch, as reported by `Date.now()`, carrying no
 * timezone or calendar information.
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/now | MDN Date.now}
 */
export type Instant = number

/**
 * A length of time.
 *
 * Reports a time span as a plain count of milliseconds, typically as a multiple of the {@link duration} constants; as
 * such, it doesn't account for calendar effects like leap years or daylight saving shifts.
 */
export type Duration = number
