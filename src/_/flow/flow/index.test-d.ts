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

import { describe, expectTypeOf, it } from "vitest";
import { bind, context, service } from "./index.js";
import type { Defined } from "@metreeca/core";
import type { Binding } from "./index.js";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

interface Store {

	readonly label: string;

}

interface Counter {

	readonly count: number;

}


declare function createStore(): Store;

declare function createMemoryStore(): Store;

declare function createCounter(): Counter;

declare function createTally(): number;

declare function createNothing(): undefined;


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

describe("bind", () => {

	it("infers the bound type from the service", async () => {

		expectTypeOf(bind(createStore, createMemoryStore)).toEqualTypeOf<Binding<Store>>();

	});

	it("rejects an implementation of an unrelated type", async () => {

		// @ts-expect-error — a `Counter` implementation cannot stand in for a `Store` service

		bind(createStore, createCounter);

	});

	it("rejects a service of an unrelated type", async () => {

		// @ts-expect-error — a `Store` implementation cannot stand in for a `Counter` service

		bind(createCounter, createStore);

	});

	it("binds a service constructing a primitive", async () => {

		expectTypeOf(bind(createTally, createTally)).toEqualTypeOf<Binding<number>>();

	});

	it("rejects a service constructing undefined", async () => {

		// @ts-expect-error — a service must construct a defined value

		bind(createNothing, createNothing);

	});

	it("erases the bound type at the binding list", async () => {

		expectTypeOf<Binding<Store>>().toExtend<Binding<Defined>>();

	});

});

describe("context", () => {

	it("accepts no bindings", async () => {

		expectTypeOf(context()).toEqualTypeOf<ReturnType<typeof context>>();

	});

	it("resolves to the value returned by the task", async () => {

		expectTypeOf(context()(() => "done")).toEqualTypeOf<Promise<string>>();

	});

	it("resolves to the value awaited from an asynchronous task", async () => {

		expectTypeOf(context()(async () => "done")).toEqualTypeOf<Promise<string>>();

	});

});

describe("service", () => {

	it("resolves to the type constructed by the service", async () => {

		expectTypeOf(service(createStore)).toEqualTypeOf<Store>();

	});

});
