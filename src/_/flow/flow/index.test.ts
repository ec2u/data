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

import { describe, expect, it, vi } from "vitest";
import { bind, context, getPath, service } from "./index.js";


interface Store {

	readonly label: string;

}


class ServiceError extends Error {}

class TaskError extends Error {}

class DisposeError extends Error {}


function createStore(): Store {
	return { label: "default" };
}

function createMemoryStore(): Store {
	return { label: "memory" };
}

function createTestStore(): Store {
	return { label: "test" };
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

describe("context", () => {

	it("resolves to the value returned by the task", async () => {

		await expect(context()(() => "done")).resolves.toBe("done");

	});

	it("resolves to the value awaited from an asynchronous task", async () => {

		await expect(context()(async () => "done")).resolves.toBe("done");

	});

	it("propagates the error thrown by the task", async () => {

		await expect(context()(() => { throw new TaskError(); })).rejects.toThrow(TaskError);

	});

	it("rejects repeated bindings for the same service", async () => {

		expect(() => context(

			bind(createStore, createMemoryStore),
			bind(createStore, createTestStore)

		)).toThrow();

	});

	it("rejects an execution nested within a running one", async () => {

		await expect(context()(() => context()(() => "inner"))).rejects.toThrow();

	});

	it("constructs fresh services on every execution", async () => {

		const create = vi.fn(createStore);
		const execute = context();

		await execute(() => { service(create); });
		await execute(() => { service(create); });

		expect(create).toHaveBeenCalledTimes(2);

	});

	it("shares no services between concurrent executions", async () => {

		const create = vi.fn(createStore);
		const execute = context();

		await Promise.all([
			execute(async () => { service(create); }),
			execute(async () => { service(create); })
		]);

		expect(create).toHaveBeenCalledTimes(2);

	});

	it("disposes the services it constructed", async () => {

		const dispose = vi.fn();
		const create = (): AsyncDisposable => ({ [Symbol.asyncDispose]: dispose });

		await context()(() => { service(create); });

		expect(dispose).toHaveBeenCalledTimes(1);

	});

	it("disposes services implementing synchronous disposal", async () => {

		const dispose = vi.fn();
		const create = (): Disposable => ({ [Symbol.dispose]: dispose });

		await context()(() => { service(create); });

		expect(dispose).toHaveBeenCalledTimes(1);

	});

	it("disposes a service implementing both disposal protocols only asynchronously", async () => {

		const dispose = vi.fn();
		const disposeAsync = vi.fn();

		const create = (): AsyncDisposable & Disposable => ({
			[Symbol.dispose]: dispose,
			[Symbol.asyncDispose]: disposeAsync
		});

		await context()(() => { service(create); });

		expect(disposeAsync).toHaveBeenCalledTimes(1);
		expect(dispose).not.toHaveBeenCalled();

	});

	it("disposes services in reverse construction order", async () => {

		const disposeFirst = vi.fn();
		const disposeSecond = vi.fn();

		const createFirst = (): AsyncDisposable => ({ [Symbol.asyncDispose]: disposeFirst });
		const createSecond = (): AsyncDisposable => ({ [Symbol.asyncDispose]: disposeSecond });

		await context()(() => {

			service(createFirst);
			service(createSecond);

		});

		expect(disposeSecond.mock.invocationCallOrder[0]).toBeLessThan(disposeFirst.mock.invocationCallOrder[0]);

	});

	it("disposes the services constructed by a failing task", async () => {

		const dispose = vi.fn();
		const create = (): AsyncDisposable => ({ [Symbol.asyncDispose]: dispose });

		await expect(context()(() => {

			service(create);

			throw new TaskError();

		})).rejects.toThrow(TaskError);

		expect(dispose).toHaveBeenCalledTimes(1);

	});

	it("propagates a disposal error", async () => {

		const create = (): AsyncDisposable => ({
			[Symbol.asyncDispose]: () => { throw new DisposeError(); }
		});

		await expect(context()(() => { service(create); })).rejects.toThrow(DisposeError);

	});

	it("composes task and disposal errors", async () => {

		const create = (): AsyncDisposable => ({
			[Symbol.asyncDispose]: () => { throw new DisposeError(); }
		});

		const error = await context()(() => {

			service(create);

			throw new TaskError();

		}).catch(reason => reason);

		expect(error).toBeInstanceOf(SuppressedError);
		expect(error.error).toBeInstanceOf(DisposeError);
		expect(error.suppressed).toBeInstanceOf(TaskError);

	});

});

describe("bind", () => {

	it("pairs a service with its implementation", async () => {

		expect(bind(createStore, createMemoryStore)).toEqual([createStore, createMemoryStore]);

	});

});

describe("service", () => {

	it("constructs an unbound service from its own default", async () => {

		await context()(() => {

			expect(service(createStore).label).toBe("default");

		});

	});

	it("constructs a bound service from the implementation bound to it", async () => {

		await context(bind(createStore, createMemoryStore))(() => {

			expect(service(createStore).label).toBe("memory");

		});

	});

	it("returns the same instance on repeated lookups", async () => {

		await context()(() => {

			expect(service(createStore)).toBe(service(createStore));

		});

	});

	it("resolves a service constructing a primitive", async () => {

		const createRoot = (): string => "/tmp";

		await context()(() => {

			expect(service(createRoot)).toBe("/tmp");

		});

	});

	it("resolves a service constructing null", async () => {

		const create = vi.fn((): null => null);

		await context()(() => {

			expect(service(create)).toBeNull();
			expect(service(create)).toBeNull();

		});

		expect(create).toHaveBeenCalledTimes(1);

	});

	it("constructs a service at most once per execution", async () => {

		const create = vi.fn(createStore);

		await context()(() => {

			service(create);
			service(create);

		});

		expect(create).toHaveBeenCalledTimes(1);

	});

	it("resolves services required by other services", async () => {

		const createIndex = (): { readonly store: Store } => ({ store: service(createStore) });

		await context()(() => {

			expect(service(createIndex).store).toBe(service(createStore));

		});

	});

	it("resolves bound services required by other services", async () => {

		const createIndex = (): { readonly store: Store } => ({ store: service(createStore) });

		await context(bind(createStore, createMemoryStore))(() => {

			expect(service(createIndex).store.label).toBe("memory");

		});

	});

	it("yields a separate instance when an implementation is resolved directly", async () => {

		await context(bind(createStore, createMemoryStore))(() => {

			expect(service(createStore)).not.toBe(service(createMemoryStore));

		});

	});

	it("rejects a service requiring itself", async () => {

		function createSelf(): object {
			return { self: service(createSelf) };
		}

		await context()(() => {

			expect(() => service(createSelf)).toThrow();

		});

	});

	it("rejects a service requiring itself through another service", async () => {

		function createLeft(): object {
			return { right: service(createRight) };
		}

		function createRight(): object {
			return { left: service(createLeft) };
		}

		await context()(() => {

			expect(() => service(createLeft)).toThrow();

		});

	});

	it("rejects a lookup outside an execution", async () => {

		expect(() => service(createStore)).toThrow();

	});

	it("rejects a lookup from within a disposer", async () => {

		const create = (): AsyncDisposable => ({
			[Symbol.asyncDispose]: async () => { service(createStore); }
		});

		await expect(context()(() => { service(create); })).rejects.toThrow();

	});

	it("rejects a lookup from work outliving the task", async () => {

		const escaped = await context()(() => () => service(createStore));

		expect(escaped).toThrow();

	});

	it("constructs again after a failed construction", async () => {

		const create = vi.fn((): Store => { throw new ServiceError(); });

		await context()(() => {

			expect(() => service(create)).toThrow(ServiceError);
			expect(() => service(create)).toThrow(ServiceError);

		});

		expect(create).toHaveBeenCalledTimes(2);

	});

});

describe("getPath", () => {

	it("constructs the working directory of the process", async () => {

		await context()(() => {

			expect(service(getPath)).toBe(process.cwd());

		});

	});

	it("is replaceable by a binding", async () => {

		await context(bind(getPath, () => "/base"))(() => {

			expect(service(getPath)).toBe("/base");

		});

	});

});
