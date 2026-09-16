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

import { schema } from "@/_/muse-google/index.js";
import { Type } from "@google/genai";
import { boolean } from "@metreeca/blue/boolean";
import { dictionary } from "@metreeca/blue/dictionary";
import { integer } from "@metreeca/blue/number";
import { reference } from "@metreeca/blue/reference";
import { id, multiple, nonempty, optional, required, resource, type } from "@metreeca/blue/resource";
import { date, string, text, time, url } from "@metreeca/blue/string";
import { union } from "@metreeca/blue/union";
import { xsd } from "@metreeca/core/datatype";
import { describe, expect, it } from "vitest";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

describe("schema", () => {

	it("states a resource as an object carrying one property per member", () => {

		expect(schema(resource({

			flag: required(boolean),
			label: required(text)

		}))).toMatchObject({

			type: Type.OBJECT,

			properties: {
				flag: { type: Type.BOOLEAN },
				label: { type: Type.STRING }
			}

		});

	});

	it("requires the members admitting at least one value", () => {

		expect(schema(resource({

			stated: required(text),
			optional: optional(text),
			repeated: nonempty(text),
			free: multiple(text)

		}))).toMatchObject({

			required: ["stated", "repeated"]

		});

	});

	it("states a member admitting more than one value as an array of its range", () => {

		expect(schema(resource({

			labels: multiple(text)

		}))).toMatchObject({

			properties: {
				labels: { type: Type.ARRAY, items: { type: Type.STRING } }
			}

		});

	});

	it("leaves out the members naming a resource", () => {

		const converted = schema(resource({

			id: id(),
			type: type(),
			label: required(text)

		}));

		expect(Object.keys(converted.properties ?? {})).toEqual(["label"]);

	});

	it("states the lexical form a pattern is drawn from", () => {

		const converted = schema(resource({

			link: required(url)

		}));

		expect(converted).toMatchObject({

			properties: {
				link: { type: Type.STRING, format: "uri" }
			}

		});

		expect(converted.properties?.link).not.toHaveProperty("pattern");

	});

	it("states a date and a time as the form they carry no zone in", () => {

		const converted = schema(resource({

			day: required(date),
			clock: required(time)

		}));

		expect(converted).toMatchObject({

			properties: {
				day: { type: Type.STRING, pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
				clock: { type: Type.STRING, pattern: "^\\d{2}:\\d{2}:\\d{2}$" }
			}

		});

		expect(converted.properties?.day).not.toHaveProperty("format");
		expect(converted.properties?.clock).not.toHaveProperty("format");

	});

	it("carries the pattern of a shape drawn from no known form", () => {

		expect(schema(resource({

			clock: required(string({ datatype: xsd.time, pattern: /^\d{2}:\d{2}$/ })),
			code: required(string({ pattern: /^[a-z]+$/, minLength: 2, maxLength: 3 }))

		}))).toMatchObject({

			properties: {
				clock: { type: Type.STRING, pattern: "^\\d{2}:\\d{2}$" },
				code: { type: Type.STRING, pattern: "^[a-z]+$", minLength: "2", maxLength: "3" }
			}

		});

	});

	it("states the values a string restricts itself to", () => {

		expect(schema(resource({

			state: required(string({ in: ["draft", "final"] }))

		}))).toMatchObject({

			properties: {
				state: { type: Type.STRING, format: "enum", enum: ["draft", "final"] }
			}

		});

	});

	it("carries the bounds of a number", () => {

		expect(schema(resource({

			count: required(integer({ minInclusive: 0, maxInclusive: 10 }))

		}))).toMatchObject({

			properties: {
				count: { type: Type.INTEGER, minimum: 0, maximum: 10 }
			}

		});

	});

	it("states a reference as the identifier it carries", () => {

		expect(schema(resource({

			about: required(reference(() => resource({ id: id() })))

		}))).toMatchObject({

			properties: {
				about: { type: Type.STRING, format: "uri" }
			}

		});

	});

	it("states a nested resource as a nested object", () => {

		expect(schema(resource({

			venue: required(() => resource({ label: required(text) }))

		}))).toMatchObject({

			properties: {
				venue: {
					type: Type.OBJECT,
					properties: { label: { type: Type.STRING } }
				}
			}

		});

	});

	it("resolves a deferred shape", () => {

		expect(schema(() => resource({ label: required(text) }))).toMatchObject({

			type: Type.OBJECT,
			properties: { label: { type: Type.STRING } }

		});

	});

	it("states a union as the alternatives it admits", () => {

		expect(schema(resource({

			entry: required(union(boolean, text))

		}))).toMatchObject({

			properties: {
				entry: { anyOf: [{ type: Type.BOOLEAN }, { type: Type.STRING }] }
			}

		});

	});

	it("states the name and the description a resource carries", () => {

		expect(schema(resource({

			name: "Event",
			description: "The event as the source states it"

		}, {

			label: required(text)

		}))).toMatchObject({

			title: "Event",
			description: "The event as the source states it"

		});

	});

	it("states the name and the description a member carries", () => {

		const converted = schema(resource({

			label: required(text, { name: "Title", description: "The name of the event" }),
			keywords: multiple(text, { name: "Topics", description: "The topics the event is tagged with" })

		}));

		expect(converted).toMatchObject({

			properties: {

				label: {
					type: Type.STRING,
					title: "Title",
					description: "The name of the event"
				},

				keywords: {
					type: Type.ARRAY,
					title: "Topics",
					description: "The topics the event is tagged with"
				}

			}

		});

		expect(converted.properties?.keywords?.items).not.toHaveProperty("title");
		expect(converted.properties?.keywords?.items).not.toHaveProperty("description");

	});

	it("states the English entry of a localised name and description", () => {

		expect(schema(resource({

			name: { en: "Event", it: "Evento" },
			description: { en: "The event", it: "L'evento" }

		}, {

			label: required(text, { name: { en: "Title", it: "Titolo" }, description: { en: "The name", it: "Il nome" } })

		}))).toMatchObject({

			title: "Event",
			description: "The event",

			properties: {
				label: { title: "Title", description: "The name" }
			}

		});

	});

	it("leaves out the name and the description of a shape carrying neither", () => {

		const converted = schema(resource({ label: required(text) }));

		expect(converted).not.toHaveProperty("title");
		expect(converted).not.toHaveProperty("description");

		expect(converted.properties?.label).not.toHaveProperty("title");
		expect(converted.properties?.label).not.toHaveProperty("description");

	});

	it("leaves out a name and a description stated in no English", () => {

		const converted = schema(resource({

			name: { it: "Evento" },
			description: { it: "L'evento" }

		}, {

			label: required(text, { name: { it: "Titolo" }, description: { it: "Il nome" } })

		}));

		expect(converted).not.toHaveProperty("title");
		expect(converted).not.toHaveProperty("description");

		expect(converted.properties?.label).not.toHaveProperty("title");
		expect(converted.properties?.label).not.toHaveProperty("description");

	});

	it("reports a range with no counterpart in a response schema", () => {

		expect(() => schema(resource({ label: required(dictionary) }))).toThrow(RangeError);

	});

});
