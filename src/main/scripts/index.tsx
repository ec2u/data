/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

import "@metreeca/tile/fonts/quicksand.css";
import { LinkGraph } from "@metreeca/tile/graphs/link";
import "@metreeca/tile/index.css";
import { Connector } from "@metreeca/tile/nests/connector";
import { Router } from "@metreeca/tile/nests/router";
import { render } from "preact";
import ToolAbout from "./pages/about";
import { ToolEvents } from "./pages/events/events";
import ToolHome from "./pages/home";
import ToolNone from "./pages/none";
import { ToolUniversities } from "./pages/universities/universities";
import { ToolUniversity } from "./pages/universities/university";
import { ToolUser } from "./pages/user";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

render((

	<Connector value={LinkGraph()}>

		<Router routes={{

			"/": ToolHome,
			"/user": ToolUser,
			"/about": ToolAbout,

			"/universities/": ToolUniversities,
			"/universities/{code}": ToolUniversity,

			"/events/": ToolEvents,

			"*": ToolNone

		}}/>

	</Connector>

), document.body);
