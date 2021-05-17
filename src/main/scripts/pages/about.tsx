/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

import { useRouter } from "@metreeca/tile/nests/router";
import { X } from "@metreeca/tile/tiles/icon";
import { ToolPage } from "../tiles/page";
import "./about.css";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export default function ToolAbout() {

	const { back }=useRouter();

	return (

		<ToolPage

			menu={<button title="Close" onClick={back}><X/></button>}

		>

			<ul> {/* !!! populate from html metadata */}

				<li>EC2U Connect Centre</li>
				<li>v1.10.2+20210710</li>

			</ul>

		</ToolPage>

	);

}
