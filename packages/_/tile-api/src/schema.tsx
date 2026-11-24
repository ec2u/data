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

import type { ResourceShape } from "@grafctory/blue/resource";
import { Link } from "@grafctory/clay-widgets/link";
import { isArray, isString, opt } from "@grafctory/core";
import type { Lexicon } from "@grafctory/core/resource";
import { Fragment } from "preact";
import type { Endpoints } from "./endpoints.core.js";
import { Code, Keyword } from "./index.core.js";
import { getShapeSchema, type ShapeSchemaValue } from "./schema.core.js";
import { getShape } from "./shapes.core.js";


/**
 * Creates the JSON Schema describing the resources of a shape.
 *
 * Sets out the {@link getShapeSchema | schema} as a code block, linking each `$ref` to the documentation it refers to.
 *
 * Sets out nothing if no shape of the model carries the given identifier.
 *
 * @param options The widget configuration
 *
 * @returns The schema declaration
 */
export function ShapeSchema({

	id,
	endpoints,
	lexicon

}: {

	/**
	 * The identifier of the shape to be described, as the last step of the route of its documentation page.
	 */
	id: string

	/**
	 * The routes served by the API, each mapped to the shape of the resources it serves.
	 */
	endpoints: Endpoints

	/**
	 * The prefixes abbreviating the IRIs of the model.
	 */
	lexicon: Lexicon

}) {
	return opt(getShape(endpoints, lexicon, id), shape =>
		<Schema endpoints={endpoints} lexicon={lexicon} shape={shape}/>
	) ?? null;
}

/**
 * Sets out the JSON Schema of a shape of the model.
 */
function Schema({

	endpoints,
	lexicon,
	shape

}: {

	/**
	 * The routes served by the API, each mapped to the shape of the resources it serves.
	 */
	endpoints: Endpoints

	/**
	 * The prefixes abbreviating the IRIs of the model.
	 */
	lexicon: Lexicon

	/**
	 * The shape to be described.
	 */
	shape: ResourceShape

}) {

	return <Code><Json value={getShapeSchema(endpoints, lexicon, shape)} depth={0}/></Code>;

}


/**
 * Sets out a JSON value of a code block, indented by depth, linking the strings keyed by `$ref` to their documentation.
 */
function Json({ value, depth, link = false }: { value: ShapeSchemaValue, depth: number, link?: boolean }) {

	const indent = "\t".repeat(depth);

	return isString(value) ? link
			? <Link href={value}>{JSON.stringify(value)}</Link>
			: <span class={"tile-api-shape-string"}>{JSON.stringify(value)}</span>
		: typeof value === "number" || typeof value === "boolean" ? <Keyword>{JSON.stringify(value)}</Keyword>
			: isArray<ShapeSchemaValue>(value) ? <>[{value.map((item, index) => <Fragment key={index}>
					{index > 0 ? ",\n" : "\n"}{indent}{"\t"}<Json value={item} depth={depth+1}/>
				</Fragment>)}{value.length > 0 && `\n${indent}`}]</>
				: <>{"{"}{Object.entries(value).map(([key, item], index) => <Fragment key={key}>
					{index > 0 ? ",\n" : "\n"}{indent}{"\t"}<span class={"tile-api-shape-attr"}>{JSON.stringify(key)}</span>: <Json
					value={item} depth={depth+1} link={key === "$ref"}
				/>
				</Fragment>)}{Object.keys(value).length > 0 && `\n${indent}`}{"}"}</>;

}
