/*
 * Copyright © 2025 Metreeca srl
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

import { units } from "@/pipelines/units/store";
import { FastifyPluginAsync } from "fastify";

/**
 * Fastify plugin providing REST API endpoints for unit resources.
 */
export const unitsRoutes: FastifyPluginAsync = async (fastify) => {

	fastify.get("/", {
		schema: {
			description: "List units with optional query parameters for filtering",
			tags: ["units"],
			querystring: {
				type: "object",
				properties: {
					updated: {
						type: "integer",
						description: "Filter by update timestamp (milliseconds from epoch)"
					},
					offset: {
						type: "integer",
						description: "Pagination offset",
						minimum: 0
					},
					limit: {
						type: "integer",
						description: "Maximum number of results",
						minimum: 1
					}
				}
			}
		}
	}, async (request) => {

		const { updated, offset, limit } = request.query as {
			updated?: string;
			offset?: string;
			limit?: string;
		};

		return await units.select({
			updated: updated ? parseInt(updated, 10) : null, // return only processed units
			offset: offset ? parseInt(offset, 10) : undefined,
			limit: limit ? parseInt(limit, 10) : undefined
		});
	});

	fastify.get("/:code", {
		schema: {
			description: "Retrieve a specific unit by its code (ID)",
			tags: ["units"],
			params: {
				type: "object",
				required: ["code"],
				properties: {
					code: {
						type: "string",
						description: "The unit identifier"
					}
				}
			}
		}
	}, async (request, reply) => {

		const { code } = request.params as { code: string };

		const unit = await units.lookup(code);

		if ( !unit ) {
			return reply.code(404).send({ error: "Unit not found" });
		}

		return unit;
	});

};
