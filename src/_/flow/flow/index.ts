/*
 * Copyright © 2020-2026 EC2U Alliance
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
 * Contextual task execution.
 *
 * Defines the contracts a task is executed under: the {@link Task} carrying the work, the {@link Context} executing
 * it, and the {@link Binding bindings} governing the facilities it draws on. The {@link context}
 * factory assembles a context from bindings supplied by {@link bind}, and {@link service} resolves a facility from
 * within the running task. The companion facility modules build on these contracts, and custom facilities honouring
 * them plug in interchangeably.
 *
 * Service location keeps a task independent of the facilities it uses: a task names a facility by its default
 * {@link Service service} rather than importing a concrete implementation, and a binding substitutes another one for
 * the duration of an execution, leaving unbound facilities to fall back on their own default.
 *
 * > [!IMPORTANT]
 * >
 * > Facilities are constructed on first use within an execution, shared for the rest of it alone, and disposed as it
 * > ends. Concurrent or repeated executions share no instances.
 *
 * @module index
 *
 * @example
 *
 * ```ts
 * await context(
 *
 *     bind(createVault, createEnvVault)
 *
 * )(async () => {
 *
 *     console.log(await service(createVault)("key"));
 *
 * });
 * ```
 */

import type { Defined } from "@metreeca/core";
import type { Awaitable } from "@metreeca/core/async";
import { report } from "@metreeca/tape";
import { AsyncLocalStorage } from "node:async_hooks";


interface Execution {

	readonly bindings: ReadonlyMap<Service<Defined>, Service<Defined>>;
	readonly instances: Map<Service<Defined>, undefined | Defined>;

}


const executions = new AsyncLocalStorage<Execution>();


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Executes a task.
 *
 * Every invocation stands on its own: services are constructed on demand, shared within that invocation alone, and
 * disposed when it ends. Concurrent invocations share no instances.
 *
 * @typeParam T The type of the value produced by the task
 *
 * @param task The task to be executed
 *
 * @returns A promise resolving to the value produced by `task`, settled after disposal has completed
 *
 * @throws {Error} If invoked from within a running execution
 *
 * @remarks
 *
 * Services implementing `AsyncDisposable` or `Disposable` are disposed in reverse construction order, whether the task
 * succeeded or failed, the asynchronous protocol taking precedence where both are implemented. Disposal runs outside
 * the execution, so a disposer resolving a service is rejected rather than constructing an instance nothing would
 * dispose. If the task and a disposal both fail, or several disposals fail, the errors are composed as nested
 * `SuppressedError`s, as `await using` would compose them.
 */
export type Context =
	<T>(task: Task<T>) => Promise<T>;

/**
 * Substitutes an implementation for a service.
 *
 * @typeParam T The type of the bound service
 */
export type Binding<T extends Defined> =
	readonly [service: Service<T>, factory: Service<T>];

/**
 * Constructs a service instance.
 *
 * Doubles as the identity of the service it constructs: services are looked up and bound by reference, so a service
 * must be declared in a single module and re-exported by reference only, as wrapping it in a new function forks the
 * identity and silently declares a second service.
 *
 * Construction must be synchronous and free of I/O, deferring such work to the instance's own methods. A service that
 * throws must undo whatever it has already done, as a failed lookup records nothing and a later lookup runs it again.
 *
 * @typeParam T The type of the constructed instance, `undefined` excepted, as it marks a service under construction
 *
 * @remarks
 *
 * Because the constructing function carries the identity, naming a service links its default implementation: the
 * module declaring a service must stay import-light, requiring heavy clients lazily inside the default implementation
 * rather than at module level.
 */
export type Service<T extends Defined> =
	() => T;

/**
 * Task to be executed under a set of bindings.
 *
 * @typeParam T The type of the value produced by the task
 */
export type Task<T> =
	() => Awaitable<T>;


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates a task executor.
 *
 * @param bindings The implementations to be substituted for the duration of each execution
 *
 * @returns A function executing a task under `bindings`; the returned value holds no service instances of its own and
 * may be reused for independent executions
 *
 * @throws {Error} If `bindings` includes more than one binding for the same service, reporting the services bound
 * more than once
 */
export function context(...bindings: readonly Binding<Defined>[]): Context {

	const duplicates = [...new Set(bindings
		.map(([ service ]) => service)
		.filter((service, index, services) => services.indexOf(service) !== index)
	)];

	if ( duplicates.length > 0 ) {
		throw new Error(`duplicate bindings for services [${duplicates.map(v => report(v)).join(", ")}]`);
	}

	const bound = new Map(bindings);

	return async task => {

		if ( executions.getStore() !== undefined ) {
			throw new Error("unsupported nested execution");
		}

		const execution: Execution = { bindings: bound, instances: new Map() };

		return executions.run(execution, () => execute(execution, task));

	};


	async function execute<T>(execution: Execution, task: Task<T>): Promise<T> {

		const outcome = await settle(task);
		const failure = await executions.exit(() => release(execution));

		if ( outcome.status === "error" && failure !== undefined ) {

			throw new SuppressedError(failure, outcome.error);

		} else if ( outcome.status === "error" ) {

			throw outcome.error;

		} else if ( failure !== undefined ) {

			throw failure;

		} else {

			return outcome.value;

		}


		async function settle<T>(task: Task<T>): Promise<| { readonly status: "value"; readonly value: T }
			| { readonly status: "error"; readonly error: unknown }> {

			try {

				return { status: "value", value: await task() };

			} catch ( error ) {

				return { status: "error", error };

			}

		}

		async function release({ instances }: Execution): Promise<unknown> {

			return [...instances.values()]
				.filter(isReleasable)
				.reverse()
				.reduce(suppress, Promise.resolve(undefined));


			function isAsyncDisposable(value: unknown): value is AsyncDisposable {
				return value instanceof Object
					&& Symbol.asyncDispose in value
					&& typeof value[Symbol.asyncDispose] === "function";
			}

			function isDisposable(value: unknown): value is Disposable {
				return value instanceof Object
					&& Symbol.dispose in value
					&& typeof value[Symbol.dispose] === "function";
			}

			function isReleasable(value: unknown): value is AsyncDisposable | Disposable {
				return isAsyncDisposable(value) || isDisposable(value);
			}

			async function suppress(

				previous: Promise<unknown>,
				disposable: AsyncDisposable | Disposable

			): Promise<unknown> {

				const suppressed = await previous;

				try {

					await ( isAsyncDisposable(disposable)
							? disposable[Symbol.asyncDispose]()
							: disposable[Symbol.dispose]()
					);

					return suppressed;

				} catch ( error ) {

					return suppressed === undefined ? error : new SuppressedError(error, suppressed);

				}

			}
		}

	}

}

/**
 * Binds an implementation to a service.
 *
 * @typeParam T The type of the bound service
 *
 * @param service The service to be bound
 * @param factory The implementation to be used in its place
 *
 * @returns An immutable binding pairing `service` with `factory`
 */
export function bind<T extends Defined>(service: Service<T>, factory: NoInfer<Service<T>>): Binding<T> {

	return [service, factory];

}

/**
 * Resolves a service.
 *
 * Returns the instance produced by the implementation bound to `service` in the enclosing execution, or by `service`
 * itself if unbound, constructing it on first lookup and sharing it with every later lookup in the same execution.
 *
 * @typeParam T The type of the resolved service
 *
 * @param service The service to be resolved
 *
 * @returns The service instance for the enclosing execution
 *
 * @throws {Error} If called outside an execution, reporting `service`; disposal of the execution's own services
 * counts as outside, as does a callback invoked from work that escaped the execution, such as a timer
 *
 * @throws {Error} If the service depends on itself, either directly or through other services, reporting the
 * dependency chain
 *
 * @remarks
 *
 * Implementations are services in their own right: resolving one directly, rather than the service it is bound to,
 * yields a separate instance.
 *
 * A task must await the work it starts. A promise chain left unawaited keeps the execution around it, so a lookup in
 * one of its continuations resolves after disposal has run, into an instance nothing will dispose.
 */
export function service<T extends Defined>(service: Service<T>): T {

	const execution = executions.getStore();

	if ( execution === undefined ) {throw new Error(`missing execution for service <${report(service)}>`);}

	return resolve(execution, service);

	function resolve<T extends Defined>(execution: Execution, service: Service<T>): T {

		const instance = execution.instances.get(service);

		if ( instance !== undefined ) {

			return instance as T;

		} else if ( execution.instances.has(service) ) {

			throw new Error(`circular dependency across services [${
				chain(execution, service).map(v => report(v)).join(", ")
			}]`);

		} else {

			return construct(execution, service);

		}

	}

	function construct<T extends Defined>({ bindings, instances }: Execution, service: Service<T>): T {

		instances.set(service, undefined);

		try {

			const instance = (bindings.get(service) ?? service)() as T;

			instances.set(service, instance);

			return instance;

		} catch ( error ) {

			instances.delete(service);

			throw error;

		}

	}

	function chain({ instances }: Execution, service: Service<Defined>): readonly Service<Defined>[] {

		return [...instances]
			.filter(([ , instance ]) => instance === undefined)
			.map(([ service ]) => service)
			.concat(service);

	}

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Constructs the base path.
 *
 * Resolves the paths a task works with, so that filesystem access is redirected by binding this service rather than
 * by altering the working directory of the process.
 *
 * @returns The absolute path of the working directory of the process
 */
export function getPath(): string {
	return process.cwd();
}
