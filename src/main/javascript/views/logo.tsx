/*
 * Copyright © 2013-2023 Metreeca srl. All rights reserved.
 */

import { Datasets } from "@ec2u/data/pages/datasets/datasets";
import { ec2u } from "@ec2u/data/views/index";
import { id } from "@metreeca/core/entry";
import { app } from "@metreeca/view";
import { ToolLogo } from "@metreeca/view/widgets/logo";
import React, { createElement } from "react";
import "./logo.css";

export function DataLogo() {
	return createElement("data-logo", {}, <a title={"Home"} href={id(Datasets)}>

		<ToolLogo/>

		<span>{ec2u(app.name)}</span>

	</a>);
}