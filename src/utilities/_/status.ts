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
 * The {@link Status} function lets you handle each state with a dedicated handler, while TypeScript
 * ensures all states are covered and values are accessed safely. Eliminates verbose conditional
 * logic and prevents bugs from unhandled cases.
 *
 * @module
 */


import { isFunction } from "@metreeca/core";

/**
 * Pattern matcher returned by the {@link Status} function.
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
export type Status<C extends Cases, F extends string = never> = {

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
 * Creates a type-safe pattern matching function for a caze with exactly one active state.
 *
 * @typeParam C The states type defining all possible variants
 * @typeParam F The fallback handler key name (defaults to `never` for no fallback)
 *
 * @param caze A caze containing exactly one property from the states type
 * @param fallback Key name for the fallback handler (required when `F` is specified, omitted when `F` is `never`)
 *
 * @returns A {@link Status} function that accepts handlers for each state
 *
 * @example
 *
 * ```typescript
 * // Handle all states explicitly
 * const result = Switch<{
 *   value: string;
 *   error: Error
 * }>({ value: "done" })({
 *   value: (v) => `value: ${v}`,
 *   error: (e) => `error: ${e.message}`
 * })
 *
 * // Use fallback for unhandled states
 * const result = Switch({ value: "done" }, "other")({
 *   value: (v) => `value: ${v}`,
 *   other: () => "unhandled"
 * })
 * ```
 */
export function Status<C extends Cases, F extends string = never>(
	caze: Case<C>,
	...[fallback]: [F] extends [never] ? [] : [F]
): Status<C, F> {

	const [label, value] = Object.entries(caze)[0] ?? []; // find the active case

	return function <R>(handlers: Partial<Handlers<C, R, F>> & Partial<Fallback<C, R, F>>): R | undefined {

		// find the matching handler or fallback

		const handler = handlers[label] || (fallback && handlers[fallback]);

		// execute handler if found

		return handler && (isFunction(handler)
				? (handler as (value: unknown) => R)(value)
				: handler as R
		);

	};

}
