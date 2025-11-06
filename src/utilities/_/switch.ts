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
 * Pattern matching for values that can be in one of several exclusive states.
 *
 * Use when working with data where exactly one variant is active at a time - like operation results
 * that are either successful or failed, UI states that are loading, ready, or error, or any domain
 * model where alternatives are mutually exclusive.
 *
 * The {@link Switch} function lets you handle each state with a dedicated handler, while TypeScript
 * ensures all states are covered and values are accessed safely. Eliminates verbose conditional
 * logic and prevents bugs from unhandled cases.
 *
 * @module
 */


import { isFunction } from "@metreeca/core";

/**
 * Pattern matcher returned by the {@link Switch} function.
 *
 * Accepts handlers for each state and returns the result from the matched handler.
 * Three usage patterns are supported:
 *
 * - All states handled: provide a handler for every state, returns `R`
 * - Some states with fallback: provide handlers for some states plus a fallback, returns `R`
 * - Some states without fallback: provide handlers for some states only, returns `R | undefined`
 *
 * @typeParam C The states type defining all possible variants
 * @typeParam F The fallback handler key name (defaults to `never` for no fallback)
 */
export type Switch<C extends Cases, F extends string = never> = {

	/**
	 * Handles all states with complete handlers.
	 *
	 * @typeParam R The return type of all handlers
	 *
	 * @param handlers Mapping of all state keys to their handlers
	 *
	 * @returns The result from the matched handler
	 */<R>(handlers: Handlers<C, R, F>): R

	/**
	 * Handles some states with a fallback.
	 *
	 * @typeParam R The return type of all handlers
	 *
	 * @param handlers Partial mapping of state keys to handlers, plus required fallback handler
	 *
	 * @returns The result from the matched handler or fallback
	 */<R>(handlers: Partial<Handlers<C, R, F>> & Fallback<C, R, F>): R

	/**
	 * Handles some states without a fallback.
	 *
	 * @typeParam R The return type of all handlers
	 *
	 * @param handlers Partial mapping of state keys to handlers
	 *
	 * @returns The result from the matched handler, or `undefined` if no handler matched
	 */<R>(handlers: Partial<Handlers<C, R, F>>): undefined | R

}

/**
 * Constraint for state definitions.
 *
 * Represents the possible states as an object type where each property key maps to a value type.
 */
export type Cases = {

	readonly [key: string]: unknown

}

/**
 * Value containing exactly one active state from the possible states.
 *
 * Enforces that only one property from the states type can be present, with all others
 * explicitly forbidden. This prevents invalid multi-state values at compile time.
 *
 * @typeParam C The states type to extract from
 */
export type Case<C extends Cases> = {

	readonly [K in keyof C]: { [P in K]: C[P] } & { [P in Exclude<keyof C, K>]?: never }

}[keyof C]

/**
 * Maps state keys to their corresponding handlers with optional fallback support.
 *
 * Each {@link Handler} receives the state's value and produces a result of type `R`. Handlers can be
 * either constant values or functions. When a fallback key is specified, an optional fallback
 * handler is added to handle unmatched states.
 *
 * @typeParam C The states type defining all possible state keys
 * @typeParam R The return type of all handlers
 * @typeParam F The fallback handler key name (defaults to `never` for no fallback)
 */
export type Handlers<C extends Cases, R, F extends string = never> = {

	readonly [K in keyof C]: Handler<C[K], R>

} & ([F] extends [never] ? {} : Partial<Fallback<C, R, F>>)


/**
 * Defines the structure of a fallback handler.
 *
 * Maps a fallback key to a {@link Handler} that receives a union of all possible state values.
 *
 * @typeParam C The states type
 * @typeParam R The return type of the handler
 * @typeParam F The fallback handler key name
 */
export type Fallback<C extends Cases, R, F extends string> = {

	readonly [K in F]: Handler<C[keyof C], R>

}

/**
 * Handler that processes a state value and produces a result.
 *
 * Can be either a constant value returned directly, or a function that computes the result
 * from the state value.
 *
 * @typeParam V The type of the state value the handler receives
 * @typeParam R The return type of the handler
 */
export type Handler<V, R> =
	| R
	| ((value: V) => R)


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates a type-safe pattern matching function for a value with exactly one active state.
 *
 * @typeParam C The states type defining all possible variants
 * @typeParam F The fallback handler key name (defaults to `never` for no fallback)
 *
 * @param value A value containing exactly one property from the states type
 * @param fallback Optional key name for the fallback handler
 *
 * @returns A {@link Switch} function that accepts handlers for each state
 *
 * @example
 *
 * ```typescript
 * // All states handled - no fallback needed
 * const result = Switch<{
 *   value: string;
 *   error: Error
 * }>({ value: "done" })({
 *   value: (v) => `value: ${v}`,
 *   error: (e) => `error: ${e.message}`
 * })
 *
 * // ✅ Valid: Fallback parameter specified when using fallback handler
 * const result = Switch({ value: "done" }, "_")({
 *   value: (v) => `value: ${v}`,
 *   _: () => "unhandled"
 * })
 *
 * // ❌ Invalid: Fallback handler without fallback parameter
 * const result = Switch({ value: "done" })({
 *   value: (v) => `value: ${v}`,
 *   _: () => "unhandled"  // This won't work - no fallback key specified
 * })
 * ```
 */
export function Switch<C extends Cases, F extends string = never>(
	value: Case<C>,
	...args: [F] extends [never] ? [] : [F]
): Switch<C, F> {
	const fallback = args[0];

	return function <R>(handlers: Partial<Handlers<C, R, F>> & Partial<Fallback<C, R, F>>): R | undefined {

		// Find the active case
		const activeCase = Object.keys(value)
			.filter(key => Object.prototype.hasOwnProperty.call(value, key))
			.map(key => ({ key, value: value[key] }))[0];

		// Find the matching handler or fallback
		const result = activeCase && (
			handlers[activeCase.key as keyof typeof handlers] !== undefined
				? {
					handler: handlers[activeCase.key as keyof typeof handlers] as Handler<unknown, R>,
					value: activeCase.value
				}
				: fallback && handlers[fallback] !== undefined
					? {
						handler: handlers[fallback] as Handler<unknown, R>,
						value: activeCase.value
					}
					: undefined
		);

		// Execute handler if found
		return result && (isFunction(result.handler)
				? (result.handler as (value: unknown) => R)(result.value)
				: result.handler as R
		);

	};

}


// ✅ Valid: Fallback parameter specified when using fallback handler
const a = Switch<{ value: string; error: Error }, "_">({ value: "done" }, "_")({
	value: (v) => `value: ${v}`,
	_: () => "unhandled"
});

// ❌ Invalid: Fallback handler without fallback parameter
const b = Switch<{ value: string; error: Error }>({ value: "done" })({
	value: (v) => `value: ${v}`,
	// @ts-expect-error - Demonstrating invalid usage: '_' is not valid without fallback parameter
	_: () => "unhandled"
});

// ❌ Invalid: Fallback type parameter specified but not passed at runtime
// @ts-expect-error - Expected 2 arguments, but got 1
const c = Switch<{ value: string; error: Error }, "_">({ value: "done" })({
	value: (v) => `value: ${v}`,
	_: () => "unhandled"
});
