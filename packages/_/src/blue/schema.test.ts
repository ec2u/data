/*
 * Copyright © 2026 Metreeca srl. All rights reserved.
 */

import { boolean } from "@metreeca/blue/boolean";
import { dictionary } from "@metreeca/blue/dictionary";
import { integer } from "@metreeca/blue/number";
import { reference } from "@metreeca/blue/reference";
import { id, multiple, nonempty, optional, required, resource, type } from "@metreeca/blue/resource";
import { date, email, instant, iri, string, text, time, timestamp, url } from "@metreeca/blue/string";
import { union } from "@metreeca/blue/union";
import { describe, expect, it } from "vitest";
import { schema } from "./schema.js";


describe("schema", () => {

	describe("resources", () => {

		it("describes a resource as an object with one property per member", async () => {

			expect(schema(resource({

				flag: required(boolean),
				label: required(string)

			}))).toEqual({

				type: "object",

				properties: {
					flag: { type: "boolean" },
					label: { type: "string" }
				},

				required: ["flag", "label"]

			});

		});

		it("requires the members admitting at least one value", async () => {

			expect(schema(resource({

				stated: required(text),
				optional: optional(text),
				repeated: nonempty(text),
				free: multiple(text)

			}))).toMatchObject({

				required: ["stated", "repeated"]

			});

		});

		it("omits required for resources with no required member", async () => {

			expect(schema(resource({ label: optional(text) }))).not.toHaveProperty("required");

		});

		it("describes a member admitting more than one value as an array of its range", async () => {

			expect(schema(resource({

				labels: multiple(text)

			}))).toMatchObject({

				properties: {
					labels: { type: "array", items: { type: "string" } }
				}

			});

		});

		it("leaves out identifier and class members", async () => {

			const converted = schema(resource({

				id: id(),
				type: type(),
				label: required(text)

			}));

			expect(Object.keys(converted.properties ?? {})).toEqual(["label"]);

		});

		it("describes a nested resource as a nested object", async () => {

			expect(schema(resource({

				venue: required(() => resource({ label: required(text) }))

			}))).toMatchObject({

				properties: {
					venue: {
						type: "object",
						properties: { label: { type: "string" } }
					}
				}

			});

		});

		it("resolves a deferred shape", async () => {

			expect(schema(() => resource({ label: required(text) }))).toMatchObject({

				type: "object",
				properties: { label: { type: "string" } }

			});

		});

		it("returns the same schema for the same shape", async () => {

			const shape = resource({ label: required(text) });

			expect(schema(shape)).toBe(schema(shape));

		});

	});

	describe("values", () => {

		it("carries the bounds of a number", async () => {

			expect(schema(resource({

				count: required(integer({ minInclusive: 0, maxInclusive: 10 }))

			}))).toMatchObject({

				properties: {
					count: { type: "integer", minimum: 0, maximum: 10 }
				}

			});

		});

		it("carries the pattern and length bounds of a string", async () => {

			expect(schema(resource({

				code: required(string({ pattern: /^[a-z]+$/, minLength: 2, maxLength: 3 }))

			}))).toMatchObject({

				properties: {
					code: { type: "string", pattern: "^[a-z]+$", minLength: 2, maxLength: 3 }
				}

			});

		});

		it("carries the values a string restricts itself to", async () => {

			const converted = schema(resource({

				state: required(string({ in: ["draft", "final"] }))

			}));

			expect(converted).toMatchObject({

				properties: {
					state: { type: "string", enum: ["draft", "final"] }
				}

			});

			expect(converted.properties?.state).not.toHaveProperty("format");

		});

		it("hints at the format of well-known lexical forms, keeping their pattern", async () => {

			const converted = schema(resource({

				link: required(url),
				name: required(iri),
				mail: required(email),
				day: required(date),
				clock: required(time),
				moment: required(instant),
				stamp: required(timestamp)

			}));

			expect(converted).toMatchObject({

				properties: {
					link: { type: "string", format: "uri", pattern: String(url().pattern) },
					name: { type: "string", format: "iri-reference", pattern: String(iri().pattern) },
					mail: { type: "string", format: "email", pattern: String(email().pattern) },
					day: { type: "string", format: "date", pattern: String(date().pattern) },
					clock: { type: "string", format: "time", pattern: String(time().pattern) },
					moment: { type: "string", format: "date-time", pattern: String(instant().pattern) },
					stamp: { type: "string", format: "date-time", pattern: String(timestamp().pattern) }
				}

			});

		});

		it("describes a reference as the IRI it carries", async () => {

			expect(schema(resource({

				about: required(reference(() => resource({ id: id() })))

			}))).toMatchObject({

				properties: {
					about: { type: "string", format: "iri-reference" }
				}

			});

		});

		it("describes a union as the alternatives it admits", async () => {

			expect(schema(resource({

				entry: required(union(boolean, text))

			}))).toMatchObject({

				properties: {
					entry: { anyOf: [{ type: "boolean" }, { type: "string" }] }
				}

			});

		});

		it("rejects localised value ranges", async () => {

			expect(() => schema(resource({ label: required(dictionary) }))).toThrow(RangeError);

		});

	});

	describe("annotations", () => {

		it("carries the name and description of a resource", async () => {

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

		it("carries the name and description of a member, annotating arrays rather than items", async () => {

			const converted = schema(resource({

				label: required(text, { name: "Title", description: "The name of the event" }),
				keywords: multiple(text, { name: "Topics", description: "The topics the event is tagged with" })

			}));

			expect(converted).toMatchObject({

				properties: {

					label: {
						type: "string",
						title: "Title",
						description: "The name of the event"
					},

					keywords: {
						type: "array",
						title: "Topics",
						description: "The topics the event is tagged with"
					}

				}

			});

			expect(converted).not.toHaveProperty(["properties", "keywords", "items", "title"]);
			expect(converted).not.toHaveProperty(["properties", "keywords", "items", "description"]);

		});

		it("carries the English entry of localised names and descriptions", async () => {

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

		it("leaves out absent names and descriptions", async () => {

			const converted = schema(resource({ label: required(text) }));

			expect(converted).not.toHaveProperty("title");
			expect(converted).not.toHaveProperty("description");

			expect(converted.properties?.label).not.toHaveProperty("title");
			expect(converted.properties?.label).not.toHaveProperty("description");

		});

		it("leaves out names and descriptions stated in no English", async () => {

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

	});

});
