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

import { app } from "@metreeca/clay";
import { Link } from "@metreeca/clay-widgets/link";
import { createElement } from "preact";
import { ec2u } from "../index.core.js";
import "./logo.css";

const logo = new URL("../index.svg", import.meta.url).href;


/**
 * Creates the site logo marking the side column of a page.
 *
 * Shows the EC2U Alliance logo, linked to the alliance website, beside the app name, linked to the home page, so a
 * reader can always reach both the alliance behind the hub and the home page of the hub itself.
 *
 * @returns The site logo
 */
export function Logo() {

	return createElement("ec2u-logo", {},

		<Link href={"https://ec2u.eu/"}><img alt={"EC2U Alliance"} src={logo}/></Link>,
		<Link href={"/"}>{ec2u(app.name ?? "")}</Link>

	);

}
