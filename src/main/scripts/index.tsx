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
import { DataEvent, Event } from "./pages/events/event";
import { DataEvents, Events } from "./pages/events/events";
import DataHome, { Home } from "./pages/home";
import ToolNone from "./pages/none";
import { DataUniversities, Universities } from "./pages/universities/universities";
import { DataUniversity, University } from "./pages/universities/university";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

render((

	<React.StrictMode>

		<ToolGraph value={LinkGraph()}>

			<ToolRouter routes={{

				[Home.id]: DataHome,
				[About.id]: DataAbout,

				[Universities.id]: DataUniversities,
				[University.id]: DataUniversity,

				[Events.id]: DataEvents,
				[Event.id]: DataEvent,

				"*": ToolNone

			}}/>

		</ToolGraph>

	</React.StrictMode>

), document.body.firstElementChild);
