/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

import * as React from "react";
import { render } from "react-dom";
import { LinkGraph } from "./@metreeca/tool/bases/link";
import "./@metreeca/tool/fonts/quicksand.css";
import "./@metreeca/tool/index.css";
import { ToolGraph } from "./@metreeca/tool/nests/graph";
import { ToolRouter } from "./@metreeca/tool/nests/router";
import DataAbout, { About } from "./pages/about";
import { Event, ToolEvent } from "./pages/events/event";
import { Events, ToolEvents } from "./pages/events/events";
import DataHome, { Home } from "./pages/home";
import ToolNone from "./pages/none";
import { ToolUniversities, Universities } from "./pages/universities/universities";
import { ToolUniversity, University } from "./pages/universities/university";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

render((

	<React.StrictMode>

		<ToolGraph value={LinkGraph()}>

			<ToolRouter routes={{

				[Home.id]: DataHome,
				[About.id]: DataAbout,

				[Universities.id]: ToolUniversities,
				[University.id]: ToolUniversity,

				[Events.id]: ToolEvents,
				[Event.id]: ToolEvent,

				"*": ToolNone

			}}/>

		</ToolGraph>

	</React.StrictMode>

), document.body.firstElementChild);
