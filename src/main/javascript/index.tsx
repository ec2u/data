/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

import { h, render } from "preact";
import Router, { Route } from "preact-router";
import "./index.less";
import ToolAbout from "./pages/about";
import ToolHome from "./pages/home";
import ToolNone from "./pages/none";
import ToolStructure from "./pages/structures/structure";
import ToolStructures from "./pages/structures/structures";
import ToolUser from "./pages/user";
import Graph from "./work/graph";
import RESTTGraph from "./work/rest";


render((

	<Graph.Provider value={RESTTGraph()}>

		<Router>

			<Route path="/" component={ToolHome}/>
			<Route path="/user" component={ToolUser}/>
			<Route path="/about" component={ToolAbout}/>

			<Route path="/structures" component={ToolStructures}/>
			<Route path="/structures/:id" component={ToolStructure}/>

			<Route default component={ToolNone}/>

		</Router>

	</Graph.Provider>

), document.body);


// @ts-ignore

import.meta.hot?.accept();

