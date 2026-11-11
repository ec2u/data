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


/**
 * Creates the legal notices of the hub.
 *
 * Shows links to the legal and privacy notices in the small print of the EU funding acknowledgement, so the two read
 * as matching blocks at the foot of a page.
 *
 * @returns The legal notices
 */
export function Notices() {

	return <small>

		<Link look={"subtle"} href={"/about/legal"}>Legal Notice</Link><br/>
		<Link look={"subtle"} href={"/about/privacy"}>Privacy Notice</Link>

	</small>;

}
