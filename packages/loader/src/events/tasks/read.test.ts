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

import { embedded } from "./read.js";
import type { Optional } from "@metreeca/core";
import type { Markdown } from "@metreeca/core/strings";
import { pipe } from "@metreeca/flow";
import { items } from "@metreeca/flow/feeds";
import { toArray } from "@metreeca/flow/sinks";
import { html } from "@metreeca/mime-xml";
import { describe, expect, it } from "vitest";


function page(...scripts: readonly string[]): string {
	return `<html lang="es"><head><title>Page</title>${
		scripts.map(script => `<script type="application/ld+json">${script}</script>`).join("")
	}</head><body><script>var SYM = {};</script></body></html>`;
}

async function render(page: string): Promise<Optional<Markdown>> {

	const [tree] = await pipe((items([page]))(html())(toArray()));

	return embedded(tree);

}


describe("embedded()", () => {

	it("renders an embedded schema.org event as a document", async () => {

		const document = await render(page(JSON.stringify({
			"@context": "https://schema.org",
			"@type": "Event",
			name: "Curso de \"cocina\"",
			description: "Aprende nociones básicas de cocina.\n\nInscripción abierta.",
			url: "https://eventum.usal.es/160908/detail/curso.html",
			startDate: "2026-11-07T10:00:00+01:00",
			endDate: "2026-11-28T14:00:00+01:00",
			eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
			location: {
				"@type": "Place",
				name: "Escuela Municipal de Hostelería",
				address: { "@type": "PostalAddress", addressLocality: "Santa Marta de Tormes", addressCountry: "España" }
			},
			image: ["https://eventum.usal.es/_files/header.jpg"]
		})));

		expect(document).toMatch(/^---\ntitle: "Curso de \\"cocina\\""\nurl: "https:\/\/eventum\.usal\.es\/160908\/detail\/curso\.html"\n---\n/);
		expect(document).toContain("# Curso de \"cocina\"");
		expect(document).toContain("Aprende nociones básicas de cocina.\n\nInscripción abierta.");
		expect(document).toContain("- Start: 2026-11-07T10:00:00+01:00");
		expect(document).toContain("- End: 2026-11-28T14:00:00+01:00");
		expect(document).toContain("- Attendance: https://schema.org/OfflineEventAttendanceMode");
		expect(document).toContain("- Location: Escuela Municipal de Hostelería, Santa Marta de Tormes, España");
		expect(document).toContain("- Image: https://eventum.usal.es/_files/header.jpg");

	});

	it("leaves out the facts an event does not state", async () => {

		const document = await render(page(JSON.stringify({
			"@type": "Event",
			name: "Seminar",
			description: "A seminar.",
			url: "https://example.org/seminar",
			startDate: "2026-11-07"
		})));

		expect(document).toContain("- Start: 2026-11-07");
		expect(document).not.toContain("- End:");
		expect(document).not.toContain("- Attendance:");
		expect(document).not.toContain("- Location:");
		expect(document).not.toContain("- Image:");

	});

	it("skips blocks describing no event", async () => {

		expect(await render(page(
			JSON.stringify({ "@type": "Organization", name: "Universidad de Salamanca" }),
			"{ not json",
			JSON.stringify({ "@type": "Event", name: "Kept", description: "Kept.", url: "https://example.org/kept" })
		))).toContain("# Kept");

	});

	it("renders only the first of several embedded events", async () => {

		const document = await render(page(
			JSON.stringify({ "@type": "Event", name: "First", description: "First.", url: "https://example.org/first" }),
			JSON.stringify({ "@type": "Event", name: "Second", description: "Second.", url: "https://example.org/second" })
		));

		expect(document).toContain("# First");
		expect(document).not.toContain("Second");

	});

	it("renders nothing for a page embedding no event", async () => {

		expect(await render(page())).toBeUndefined();

	});

});
