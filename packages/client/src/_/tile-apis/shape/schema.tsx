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

import type { ResourceShape } from "@metreeca/blue/resource";
import { Link } from "@metreeca/clay-widgets/link";
import { isArray, isString, type Lazy } from "@metreeca/core";
import { Fragment } from "preact";
import { Code, Keyword } from "./code.js";
import { getShapeSchema, type ShapeSchemaValue } from "./index.js";


/**
 * Creates the JSON Schema describing the resources of a shape.
 *
 * Sets out the {@link getShapeSchema | schema} as a code block, linking each `$ref` to the documentation it refers to.
 *
 * @param options The widget configuration
 *
 * @returns The schema declaration
 */
export function ShapeSchema({

	shape

}: {

	/**
	 * The shape to be described, possibly deferred.
	 */
	shape: Lazy<ResourceShape>

}) {

	return <Code><Json value={getShapeSchema(shape)} depth={0}/></Code>;

}



/**
 * Sets out a JSON value of a code block, indented by depth, linking the strings keyed by `$ref` to their documentation.
 */
function Json({ value, depth, link = false }: { value: ShapeSchemaValue, depth: number, link?: boolean }) {

	const indent = "\t".repeat(depth);

	return isString(value) ? link
			? <Link href={value}>{JSON.stringify(value)}</Link>
			: <span class={"ec2u-shape-string"}>{JSON.stringify(value)}</span>
		: typeof value === "number" || typeof value === "boolean" ? <Keyword>{JSON.stringify(value)}</Keyword>
			: isArray<ShapeSchemaValue>(value) ? <>[{value.map((item, index) => <Fragment key={index}>
					{index > 0 ? ",\n" : "\n"}{indent}{"\t"}<Json value={item} depth={depth+1}/>
				</Fragment>)}{value.length > 0 && `\n${indent}`}]</>
				: <>{"{"}{Object.entries(value).map(([key, item], index) => <Fragment key={key}>
					{index > 0 ? ",\n" : "\n"}{indent}{"\t"}<span class={"ec2u-shape-attr"}>{JSON.stringify(key)}</span>: <Json
					value={item} depth={depth+1} link={key === "$ref"}
				/>
				</Fragment>)}{Object.keys(value).length > 0 && `\n${indent}`}{"}"}</>;

}
