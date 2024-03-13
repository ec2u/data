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

import { immutable, multiple } from "@metreeca/core";
import { icon } from "@metreeca/view";
import { Files } from "@metreeca/view/widgets/icon";
import * as React from "react";


export const Documents=immutable({

	[icon]: <Files/>,

	id: "/documents/",
	label: { "en": "Documents" },

	contains: multiple({

		id: "",
		label: { "en": "" },
		comment: { "en": "" },

		university: {
			id: "",
			label: { "en": "" }
		}

	})
});


// export function DataDocuments() {
//
// 	const [route, setRoute]=useRoute();
// 	const [query, setQuery]=useQuery({ ".order": "label" }, sessionStorage);
//
//
// 	useEffect(() => { setRoute({ title: string(Documents) }); }, []);
//
//
// 	return <DataPage item={string(Documents)}
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
// 			<NodeOptions path={"audience"} type={"anyURI"} placeholder={"Audience"} state={[query, setQuery]}/>
// 			<NodeOptions path={"subject"} type={"anyURI"} placeholder={"Topic"} state={[query, setQuery]}/>
// 			<NodeOptions path={"language"} type={"string"} placeholder={"Language"} state={[query, setQuery]}/>
// 			<NodeOptions path={"license"} type={"string"} placeholder={"License"} state={[query, setQuery]}/>
//
// 		</DataPane>}
//
// 		deps={[JSON.stringify(query)]}
//
// 	>
//
// 		<NodeItems model={Documents} placeholder={DocumentsIcon} state={[query, setQuery]}>{({
//
// 			id,
// 			label,
// 			comment,
//
// 			university
//
// 		}) =>
//
// 			<DataCard key={id} compact
//
// 				name={<a href={id}>{string(label)}</a>}
// 				tags={<span>{string(university) || "EC2U Alliance"}</span>}
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
