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
import { date, string, text, url } from "@metreeca/blue/string";
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

			day: required(date),
			link: required(url)

		}));

		expect(converted).toMatchObject({

			properties: {
				day: { type: Type.STRING, format: "date" },
				link: { type: Type.STRING, format: "uri" }
			}

		});

		expect(converted.properties?.day).not.toHaveProperty("pattern");
		expect(converted.properties?.link).not.toHaveProperty("pattern");

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

	it("reports a range with no counterpart in a response schema", () => {

		expect(() => schema(resource({ label: required(dictionary) }))).toThrow(RangeError);

	});

});
