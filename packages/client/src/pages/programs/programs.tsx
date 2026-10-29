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

import { Programs } from "@ec2u/data-shared/programs/index.js";
import { immutable } from "@metreeca/core/values";
import { Button } from "@metreeca/tile-cell/button";
import { Hint } from "@metreeca/tile-cell/hint";
import { Icon } from "@metreeca/tile-cell/icon";
import { Link } from "@metreeca/tile-cell/link";
import { More } from "@metreeca/tile-cell/more";
import { useRoute, useRouter } from "@metreeca/tile-data/router";
import { useCollection, useCount, useMembers } from "@metreeca/tile-data/store";
import { Card } from "@metreeca/tile-hive/card";
import { useEffect } from "preact/hooks";
import { Count } from "../../tiles/count.js";
import { Failure } from "../../tiles/failure.js";
import { Page } from "../../tiles/page.js";


export const programs = immutable({

	route: "/programs/",
	label: "Programs",
	glyph: <Icon.GraduationCap/>,

	model: {

		id: {},
		label: {},
		comment: {},

		year: {},

		university: { id: {}, label: {} }

	}

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function ProgramsPage() {

	const route = useRoute();
	const router = useRouter();

	const collection = useCollection({
		entry: route,
		shape: Programs,
		field: "resources"
	});

	const members = useMembers(collection, { model: programs.model });
	const count = useCount(collection);

	useEffect(() => router({ title: programs.label }), []);


	return <Page

		head={programs.label}
		menu={<Button icon={<Icon.Help/>} title={"Help"}/>}

		back={members({

			error: ({ reload }) => <Button icon={<Icon.Reload/>} title={"Reload"} onClick={reload}/>

		})}

		info={<Count filtered={false}>{count({

			ready: ({ state }) => state

		})}</Count>}

	>{members({

		blank: () => <Hint>{programs.glyph}</Hint>,
		error: ({ state }) => <Failure problem={state}><Hint>{programs.glyph}</Hint></Failure>,

		ready: ({ state, load }) => state.length === 0 ? <Hint>{programs.glyph}</Hint> : <>

			{state.map(({ id, label, comment, year, university }) => <Card key={id}

				title={<Link look={"strong"} href={id}>{label}</Link>}
				tags={[university?.label, year].filter(Boolean).join(" · ")}

			>{comment}</Card>)}

			{load && <More onLoad={load}/>}

		</>

	})}</Page>;

}
