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

import { describe, expect, it, vi } from "vitest";
import { dispose } from "./_disposal.js";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

class DisposalError extends Error {}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

describe("dispose", () => {

	it("releases a delegate under the asynchronous protocol", async () => {

		const release = vi.fn(async () => {});

		await dispose({ [Symbol.asyncDispose]: release });

		expect(release).toHaveBeenCalledTimes(1);

	});

	it("releases a delegate under the synchronous protocol", async () => {

		const release = vi.fn(() => {});

		await dispose({ [Symbol.dispose]: release });

		expect(release).toHaveBeenCalledTimes(1);

	});

	it("prefers the asynchronous protocol where both are exposed", async () => {

		const releaseAsync = vi.fn(async () => {});
		const release = vi.fn(() => {});

		await dispose({ [Symbol.asyncDispose]: releaseAsync, [Symbol.dispose]: release });

		expect(releaseAsync).toHaveBeenCalledTimes(1);
		expect(release).not.toHaveBeenCalled();

	});

	it("leaves a delegate taking part in neither protocol as it is", async () => {

		await expect(dispose({ value: "delegate" })).resolves.toBeUndefined();

	});

	it("releases a delegate as the receiver of its own protocol", async () => {

		const delegate = {

			released: false,

			[Symbol.dispose]() { this.released = true; }

		};

		await dispose(delegate);

		expect(delegate.released).toBeTruthy();

	});

	it("settles as the asynchronous release completes", async () => {

		const completed = vi.fn();

		await dispose({

			[Symbol.asyncDispose]: async () => {

				await new Promise(resolve => setTimeout(resolve, 10));

				completed();

			}

		});

		expect(completed).toHaveBeenCalledTimes(1);

	});

	it("reports a failed release", async () => {

		await expect(dispose({

			[Symbol.asyncDispose]: async () => { throw new DisposalError(); }

		})).rejects.toThrow(DisposalError);

	});

});
