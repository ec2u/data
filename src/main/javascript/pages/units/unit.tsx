/*
 * Copyright © 2020-2023 EC2U Alliance
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

import { Units, UnitsIcon } from "@ec2u/data/pages/units/units";
import { DataBack } from "@ec2u/data/tiles/back";
import { DataCard } from "@ec2u/data/tiles/card";
import { DataInfo } from "@ec2u/data/tiles/info";
import { DataPage } from "@ec2u/data/tiles/page";
import { DataPane } from "@ec2u/data/tiles/pane";
import { immutable } from "@metreeca/core";
import { multiple, optional, repeatable, string } from "@metreeca/core/value";
import { useEntry } from "@metreeca/view/nests/graph";
import { useRoute } from "@metreeca/view/nests/router";
import { NodeHint } from "@metreeca/view/tiles/hint";
import { NodeLink } from "@metreeca/view/tiles/link";
import { NodeSpin } from "@metreeca/view/tiles/spin";
import * as React from "react";
import { useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";


export const Unit=immutable({

	id: "/units/{code}",

	label: { "en": "Unit" },
	comment: { "en": "" },

	university: {
		id: "",
		label: { "en": "" }
	},

	subject: multiple({
		id: "",
		label: { "en": "" }
	}),

	homepage: multiple(""),

	prefLabel: { "en": "" },
	altLabel: optional({ "en": "" }),

	classification: optional({
		id: "",
		label: { "en": "" }
	}),

	head: multiple({
		id: "",
		label: { "en": "" }
	}),

	unitOf: repeatable({
		id: "",
		label: { "en": "" }
	}),

	hasUnit: multiple({
		id: "",
		label: { "en": "" }
	})

});


export function DataUnit() {

	const [route, setRoute]=useRoute();

	const entry=useEntry(route, Unit);


	useEffect(() => setRoute({ title: entry({ value: ({ label }) => string(label) }) }));


	return <DataPage item={entry({
		value: ({ altLabel, prefLabel }) =>
			altLabel ? `${string(altLabel)} - ${string(prefLabel)}` : string(prefLabel)
	})}

		menu={entry({ fetch: <NodeSpin/> })}

		pane={<DataPane

			header={<DataBack>{Units}</DataBack>}

		>{entry({

			value: unit => <DataUnitInfo>{unit}</DataUnitInfo>

		})}</DataPane>}

	>{entry({

		fetch: <NodeHint>{UnitsIcon}</NodeHint>,

		value: value => <DataUnitBody>{value}</DataUnitBody>,

		error: error => <span>{error.status}</span> // !!! report

	})}</DataPage>;

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function DataUnitInfo({

	children: {

		university,

		subject,

		label,
		altLabel,

		homepage,

		classification,
		head,

		unitOf

	}

}: {

	children: typeof Unit

}) {

	return <>

		<DataInfo>{{

			"University": university && <NodeLink>{university}</NodeLink>,

			"Parent": unitOf && unitOf.some(unit => !university || unit.id !== university.id) && <ul>{unitOf
				.filter(unit => !university || unit.id !== university.id)
				.sort((x, y) => string(x).localeCompare(string(y)))
				.map(unit => <li key={unit.id}><NodeLink>{unit}</NodeLink></li>)
			}</ul>,

			"Type": classification && <NodeLink>{classification}</NodeLink>

		}}</DataInfo>

		<DataInfo>{{

			"Acronym": altLabel && <span>{string(altLabel)}</span>,
			"Name": <span>{string(label)}</span>,

			"Head": head?.length === 1 ? <span>{string(head[0])}</span> : head?.length && <ul>{[...head]
				.sort((x, y) => string(x).localeCompare(string(y)))
				.map(head => <li key={head.id}>{string(head)}</li>)
			}</ul>,

			"Topics": subject && subject.length && <ul>{[...subject]
				.sort((x, y) => string(x).localeCompare(string(y)))
				.map(subject => <li key={subject.id}>
					<NodeLink search={[Units, { university, subject }]}>{subject}</NodeLink>
				</li>)
			}</ul>

		}}</DataInfo>

		<DataInfo>{{

			"Info": homepage && homepage.length && homepage.map(url =>
				<a key={url} href={url}>{new URL(url).host}</a>
			)

		}}</DataInfo>

	</>;
}

function DataUnitBody({

	children: {

		comment,

		hasUnit

	}

}: {

	children: typeof Unit

}) {

	return <DataCard>

		<ReactMarkdown

			remarkPlugins={[remarkGfm]}

		>{

			string(comment)

		}</ReactMarkdown>


		{hasUnit && <>

			{comment && <hr/>}

            <dl>

                <dt>Organizational Units</dt>

                <dt>
                    <ul>{hasUnit.map(unit =>
						<li key={unit.id}><NodeLink>{unit}</NodeLink></li>
					)}</ul>
                </dt>

            </dl>

        </>}

	</DataCard>;

}
