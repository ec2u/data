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
import { type IncomingMessage, request } from "node:http";
import type { AddressInfo } from "node:net";
import { text } from "node:stream/consumers";
import { describe, expect, it } from "vitest";
import { robots } from "./robots.js";


const base = "https://data.ec2u.eu/";


async function served(host: string): Promise<{ readonly tag: string | undefined, readonly body: string }> {

	const app = express()
		.use(robots(base))
		.get("/", (_request, response) => { response.send("ok"); });

	const server = app.listen(0);

	try {

		await new Promise(resolve => server.once("listening", resolve));

		const port = (server.address() as AddressInfo).port; // a TCP listener: never a pipe path

		const response = await new Promise<IncomingMessage>((resolve, reject) =>
			request({ port, path: "/", headers: { host } }, resolve).on("error", reject).end()
		);

		return {
			tag: response.headers["x-robots-tag"]?.toString(),
			body: await text(response)
		};

	} finally {

		server.close();

	}

}


describe("robots()", () => {

	it("leaves the canonical host indexable", async () => {
		expect((await served("data.ec2u.eu")).tag).toBeUndefined();
	});

	it("marks alternate production names as not indexable", async () => {
		expect((await served("data.ec2u.cc")).tag).toBe("noindex");
	});

	it("marks preview names as not indexable", async () => {
		expect((await served("edge.data.ec2u.cc")).tag).toBe("noindex");
	});

	it("marks run.app addresses as not indexable", async () => {
		expect((await served("main-server-abc123-ew.a.run.app")).tag).toBe("noindex");
	});

	it("passes requests on to the routes", async () => {
		expect((await served("edge.data.ec2u.cc")).body).toBe("ok");
	});

});
