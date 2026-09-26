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

import { University } from "@ec2u/data-shared/universities/index.js";
import { immutable } from "@metreeca/core/values";
import { Button } from "@metreeca/tile-cell/button";
import { Fault } from "@metreeca/tile-cell/fault";
import { Hint } from "@metreeca/tile-cell/hint";
import { Icon } from "@metreeca/tile-cell/icon";
import { useRoute } from "@metreeca/tile-data/router";
import { useResource } from "@metreeca/tile-data/store";
import { Page } from "../../tiles/page.js";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const university = immutable({

	route: "/universities/:university",
	label: "University",
	glyph: <Icon.Landmark/>,

	model: {
		id: {},
		label: {},
		inception: {},
		students: {}
	}

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function UniversityPage() {

	const route = useRoute();

	const resource = useResource({
		entry: route,
		shape: University,
		model: university.model
	});

	return <Page

		head={resource({

			ready: ({ state }) => state.label

		}, university.label)}

		menu={<Button icon={<Icon.Help/>} title={"Help"}/>}

		back={resource({

			error: ({ reload }) => <Button icon={<Icon.Reload/>} title={"Reload"} onClick={reload}/>

		})}

	>{resource({

		blank: () => <Hint>{university.glyph}</Hint>,
		error: ({ state }) => <Fault {...state}/>,

		ready: ({ state: { inception, students } }) => <dl>

			<dt>Inception</dt>
			<dd>{inception}</dd>

			<dt>Students</dt>
			<dd>{students}</dd>

		</dl>

	})}</Page>;

}
