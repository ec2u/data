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
import "./identity.css";


/**
 * Creates the site identity heading a page on narrow viewports.
 *
 * Shows the app name, linked to the home page, above the page title where the side column naming the site turns into
 * a drawer, so a reader landing on the page knows at once which site it is; hidden wherever the side column shows.
 *
 * @returns The site identity
 */
export function Identity() {

	return createElement("ec2u-identity", {}, <Link href={"/"}>{ec2u(app.name ?? "")}</Link>);

}
