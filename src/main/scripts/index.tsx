/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

import { Graph } from "@metreeca/tile";
import { LinkGraph } from "@metreeca/tile/graphs/link";
import "@metreeca/tile/index.less";
import { Router } from "@metreeca/tile/nests/router";
import { render } from "preact";
import "./index.less";
import ToolAbout from "./pages/about";
import ToolNone from "./pages/none";
import ToolStructure from "./pages/structures/structure";
import ToolStructures from "./pages/structures/structures";
import ToolUniversities from "./pages/universities/universities";
import ToolUniversity from "./pages/universities/university";
import ToolUser from "./pages/user";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

render((

	<Graph.Provider value={LinkGraph()}>

		<Router routes={{

			"/": "/universities/ "/*ToolHome*/,
			"/user": ToolUser,
			"/about": ToolAbout,

			"/universities/": ToolUniversities,
			"/universities/{code}": ToolUniversity,

			"/structures/": ToolStructures,
			"/structures/{code}": ToolStructure,

			"*": ToolNone

		}}/>

	</Graph.Provider>

), document.body);
