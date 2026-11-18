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

import express from "express";
import type { AddressInfo } from "node:net";
import { describe, expect, it } from "vitest";
import { robots } from "./robots.js";


async function served(environment: string): Promise<Response> {

	const app = express()
		.use(robots(environment))
		.get("/", (_request, response) => { response.send("ok"); });

	const server = app.listen(0);

	try {

		await new Promise(resolve => server.once("listening", resolve));

		return await fetch(`http://localhost:${(server.address() as AddressInfo).port}/`); // a TCP listener: never a pipe path

	} finally {

		server.close();

	}

}


describe("robots()", () => {

	it("marks development responses as not indexable", async () => {
		expect((await served("edge")).headers.get("x-robots-tag")).toBe("noindex");
	});

	it("marks staging responses as not indexable", async () => {
		expect((await served("next")).headers.get("x-robots-tag")).toBe("noindex");
	});

	it("leaves production responses indexable", async () => {
		expect((await served("main")).headers.get("x-robots-tag")).toBeNull();
	});

	it("passes requests on to the routes", async () => {
		expect(await (await served("edge")).text()).toBe("ok");
	});

});
