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
 * Shared service provisioning.
 *
 * @module
 */

import { error } from "@metreeca/core";
import { AsyncLocalStorage } from "node:async_hooks";


/**
 * A shared service accessor.
 *
 * Doubles as the service token: the accessor reports the value provisioned for the running bench, either the bound
 * one or the one created on demand by its default factory.
 *
 * @typeParam T The type of the shared service
 */
export type Service<T> = {

	(): T;

	/**
	 * Binds a value to this service.
	 *
	 * @param value The value to be reported by this accessor for the duration of the bench the returned binding is
	 * laid on
	 *
	 * @returns A binding replacing the default factory of this service with `value`
	 */
	readonly with: (value: T) => Binding;

}

/**
 * A service binding.
 *
 * Installs a value into a bench, identified by an opaque token services key their own storage on.
 */
export type Binding = (bench: object) => void;


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const benches = new AsyncLocalStorage<object>();


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Declares a shared service.
 *
 * @typeParam T The type of the shared service
 *
 * @param factory The factory creating the service value for benches where it isn't bound to a value
 *
 * @returns An accessor reporting the value provisioned for the running bench, memoised for its whole duration
 *
 * @throws If the accessor is called outside a {@link using | bench}
 */
export function service<T>(factory: () => T): Service<T> {

	const values = new WeakMap<object, { readonly value: T }>();

	function resolve(): T {

		const bench = benches.getStore() ?? error("undefined service bench");
		const cached = values.get(bench);

		if ( cached ) {

			return cached.value;

		} else {

			const value = factory();

			values.set(bench, { value }); // defaults are memoised for the lifetime of the bench

			return value;

		}

	}

	return Object.assign(resolve, {

		with: (value: T): Binding => bench => {
			values.set(bench, { value }); // binding installation is effectful by nature
		}

	});

}

/**
 * Executes a task on a bench.
 *
 * Lays out a bench for the duration of the task, provisioning the services it requests and releasing them with it.
 *
 * @typeParam V The type of the value reported by the task
 *
 * @param bindings The service bindings to be laid on the bench
 * @param task The task to be executed
 *
 * @returns The value reported by `task`
 *
 * @throws If a bench is already running, as benches are not nestable
 */
export function using<V>(bindings: readonly Binding[], task: () => V): V {

	if ( benches.getStore() ) { error("nested service bench"); }

	const bench = {}; // opaque bench token

	bindings.forEach(binding => binding(bench)); // binding installation is effectful by nature

	return benches.run(bench, task);

}
