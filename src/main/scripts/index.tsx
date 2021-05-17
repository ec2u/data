/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

import { Graph } from "@metreeca/tile";
import "@metreeca/tile/fonts/quicksand.css";
import { LinkGraph } from "@metreeca/tile/graphs/link";
import "@metreeca/tile/index.css";
import { Router } from "@metreeca/tile/nests/router";
import { render } from "preact";
import "./index.css";
import ToolAbout from "./pages/about";
import ToolHome from "./pages/home";
import ToolNone from "./pages/none";
import ToolStructure from "./pages/structures/structure";
import { ToolStructures } from "./pages/structures/structures";
import { ToolUniversities } from "./pages/universities/universities";
import { ToolUniversity } from "./pages/universities/university";
import { ToolUser } from "./pages/user";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

render((

	<Graph.Provider value={LinkGraph()}>

		<Router routes={{

			"/": ToolHome,
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
