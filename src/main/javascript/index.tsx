/*
 * Copyright © 2021-2021 EC2U Consortium
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

import React from "react";
import { render } from "react-dom";
import { HashRouter, Route, Switch } from "react-router-dom";
import ToolHome from "./pages/home";
import ToolNone from "./pages/none";

window.onload=() => {

	render((

		// <GraphContext.Provider value={RESTTGraph()}>

		<HashRouter>
			<Switch>

				<Route path={`/`} exact component={ToolHome}/>

				{/*<Route path="/articles" render={({ match: { url } }) => (<>*/}
				{/*	<Route path={`${url}/`} exact component={NewsArticles}/>*/}
				{/*	<Route path={`${url}/:id`} component={NewsArticle}/>*/}
				{/*</>)}/>*/}

				<Route component={ToolNone}/>

			</Switch>
		</HashRouter>

		// </GraphContext.Provider>

	), document.querySelector("body > main"));

};
