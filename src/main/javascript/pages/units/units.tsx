/*
 * Copyright © 2020-2024 EC2U Alliance
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

import { immutable, multiple, optional } from "@metreeca/core";
import { icon } from "@metreeca/view";
import { FlaskConical } from "@metreeca/view/widgets/icon";
import * as React from "react";


export const Units=immutable({

	[icon]: <FlaskConical/>,

	id: "/units/",
	label: { "en": "Units" },

	members: multiple({

		id: "",
		label: { "en": "" },
		comment: { "en": "" },

		classification: {
			id: "",
			label: { "en": "" }
		},

		prefLabel: { "en": "" },
		altLabel: optional({ "en": "" }),

		university: {
			id: "",
			label: { "en": "" }
		}

	})
});


// export function DataUnits() {
//
// 	const [route, setRoute]=useRoute();
// 	const [query, setQuery]=useQuery({ ".order": "label" }, sessionStorage);
//
//
// 	useEffect(() => { setRoute({ title: string(Units) }); }, []);
//
//
// 	return <DataPage item={string(Units)}
//
// 		menu={<DataMeta>{route}</DataMeta>}
//
// 		pane={<DataPane
//
// 			header={<NodeKeywords state={[query, setQuery]}/>}
// 			footer={<NodeCount state={[query, setQuery]}/>}
//
// 		>
//
// 			<NodeOptions path={"university"} type={"anyURI"} placeholder={"University"} state={[query, setQuery]}/>
// 			<NodeOptions path={"type"} type={"anyURI"} placeholder={"Type"} state={[query, setQuery]}/>
// 			<NodeOptions path={"subject"} type={"string"} placeholder={"Topic"} state={[query, setQuery]}/>
//
// 		</DataPane>}
//
// 		deps={[JSON.stringify(query)]}
//
// 	>
//
// 		<NodeItems model={Units} placeholder={UnitsIcon} state={[query, setQuery]}>{({
//
// 			id,
// 			comment,
//
// 			classification,
//
// 			university,
// 			prefLabel,
// 			altLabel
//
// 		}) =>
//
// 			<DataCard key={id} compact
//
// 				name={<a href={id}>{altLabel ? `${string(altLabel)} - ${string(prefLabel)}` : string(prefLabel)}</a>}
//
// 				tags={<>
// 					<span>{string(university) || "EC2U Alliance"}</span>
// 					{classification && <><br/><span>{string(classification)}</span></>}
// 				</>}
//
// 			>
//
// 				{string(comment)}
//
// 			</DataCard>
//
// 		}</NodeItems>
//
// 	</DataPage>;
//
// }
