/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

import * as React from "react";
import { createElement } from "react";
import { array, frame, string, Value } from "../@metreeca/tool/bases";
import { Tag } from "../@metreeca/tool/tiles/icon";
import "./tags.css";

export function DataTags({

	values

}: {

	values: Value | Value[]

}) {
	return createElement("data-tags", {}, (array(values) ? values : [values]).map(value => frame(value)
		? <a key={value.id} href={value.id}><Tag/>{string(value.label)}</a>
		: <span key={string(value)}><Tag/>{string(value)}</span>
	));
}