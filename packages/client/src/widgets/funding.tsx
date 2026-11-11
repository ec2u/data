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

import { Link } from "@metreeca/clay-widgets/link";
import { dedent } from "@metreeca/core/strings";
import { createElement } from "preact";
import "./funding.css";
import { Print } from "./print.js";

const positive = new URL("../assets/ec2u/eu-co-funded-positive.png", import.meta.url).href;
const negative = new URL("../assets/ec2u/eu-co-funded-negative.png", import.meta.url).href;


/**
 * Creates the EU funding acknowledgement.
 *
 * Shows the EU emblem with the disclaimer the grant agreement requires on the communication of a funded action, sized
 * for the foot of a page: the disclaimer faces the emblem where the foot is wide enough, and drops under it otherwise.
 * The emblem takes its official negative version, with the funding statement set in white, on a dark colour scheme.
 *
 * @returns The funding acknowledgement
 */
export function Funding() {

	return createElement("ec2u-funding", {}, <Print>

		<Link href={"https://education.ec.europa.eu/education-levels/higher-education/european-universities-initiative"}>
			<picture>
				<source media={"(prefers-color-scheme: dark)"} srcset={negative}/>
				<img alt={"Co-funded by the European Union"} src={positive}/>
			</picture>
		</Link>

		<span>{dedent`
			Funded by the European Union. Views and opinions expressed are however
			those of the author(s) only and do not necessarily reflect those of the European Union.
			Neither the European Union nor the granting authority can be held responsible for them.
		`}</span>

	</Print>);

}
