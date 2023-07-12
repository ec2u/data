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

import { Documents, DocumentsIcon } from "@ec2u/data/pages/documents/documents";
import { DataBack } from "@ec2u/data/tiles/back";
import { DataCard } from "@ec2u/data/tiles/card";
import { DataInfo } from "@ec2u/data/tiles/info";
import { DataPage } from "@ec2u/data/tiles/page";
import { DataPane } from "@ec2u/data/tiles/pane";
import { immutable } from "@metreeca/core";
import { toIRIString } from "@metreeca/core/_iri";
import { multiple, optional, string } from "@metreeca/core/value";
import { useEntry } from "@metreeca/view/nests/graph";
import { useRoute } from "@metreeca/view/nests/router";
import { NodeHint } from "@metreeca/view/tiles/hint";
import { toLocaleDateString } from "@metreeca/view/tiles/inputs/date";
import { NodeLink } from "@metreeca/view/tiles/link";
import { NodeSpin } from "@metreeca/view/tiles/spin";
import * as React from "react";
import { useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";


export const Document=immutable({

	id: "/documents/{code}",

	label: { "en": "Document" },
	comment: { "en": "" },

	university: {
		id: "",
		label: { "en": "" }
	},

	url: multiple(""),

	identifier: optional(""),
	language: multiple(""),

	type: multiple({
		id: "",
		label: { "en": "" }
	}),

	issued: optional(""),
	modified: optional(""),
	valid: optional(""),


	publisher: optional({
		id: "",
		label: { "en": "" },
		homepage: optional("")
	}),

	creator: optional({
		id: "",
		label: { "en": "" }
	}),

	contributor: multiple({
		id: "",
		label: { "en": "" }
	}),

	license: optional(""),
	rights: optional(""),

	subject: multiple({
		id: "",
		label: { "en": "" }
	}),

	audience: multiple({
		id: "",
		label: { "en": "" }
	}),

	relation: multiple({
		id: "",
		label: { "en": "" }
	})

});


export function DataDocument() {

	const [route, setRoute]=useRoute();

	const entry=useEntry(route, Document);


	useEffect(() => setRoute({ title: entry({ value: ({ label }) => string(label) }) }));


	return <DataPage item={entry({
		value: ({ label }) => string(label)
	})}

		menu={entry({ fetch: <NodeSpin/> })}

		pane={<DataPane

			header={<DataBack>{Documents}</DataBack>}

		>{entry({

			value: value => <DataDocumentInfo>{value}</DataDocumentInfo>

		})}</DataPane>}

	>{entry({

		fetch: <NodeHint>{DocumentsIcon}</NodeHint>,

		value: value => <DataDocumentBody>{value}</DataDocumentBody>,

		error: error => <span>{error.status}</span> // !!! report

	})}</DataPage>;

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function DataDocumentInfo({

	children: {

		university,

		label,

		url,

		identifier,
		language,

		type,
		subject,
		audience,

		issued,
		modified,
		valid,

		publisher,
		creator,
		contributor,

		license,
		rights

	}

}: {

	children: typeof Document

}) {

	return <>

		<DataInfo>{{

			"University": university && <NodeLink>{university}</NodeLink>

		}}</DataInfo>

		<DataInfo>{{

			"Code": identifier && <span>{identifier}</span>,

			"Title": <span>{string(label)}</span>,

			"Web": url?.length && url.map(item => <a key={item} href={item}>{toIRIString(item)}</a>),

			"Language": language?.length && language.map(item => <span key={item}>{item}</span>)

		}}</DataInfo>

		<DataInfo>{{

			"Type": type && type.length && <ul>{[...type]
				.sort((x, y) => string(x).localeCompare(string(y)))
				.map(type => <li key={type.id}>
					<NodeLink search={[Documents, { university, subject: type }]}>{type}</NodeLink>
				</li>)
			}</ul>,

			"Audience": audience && audience.length && <ul>{[...audience]
				.sort((x, y) => string(x).localeCompare(string(y)))
				.map(audience => <li key={audience.id}>
					<NodeLink search={[Documents, { university, audience }]}>{audience}</NodeLink>
				</li>)
			}</ul>,

			"Topics": subject && subject.length && <ul>{[...subject]
				.sort((x, y) => string(x).localeCompare(string(y)))
				.map(subject => <li key={subject.id}>
					<NodeLink search={[Documents, { university, subject }]}>{subject}</NodeLink>
				</li>)
			}</ul>

		}}</DataInfo>

		<DataInfo>{{

			"Issued": issued && toLocaleDateString(new Date(issued)),
			"Updated": modified && toLocaleDateString(new Date(modified)),
			"Valid": valid

		}}</DataInfo>

		<DataInfo>{{

			"Publisher": publisher && (publisher.homepage
					? <a href={publisher.homepage}>{string(publisher)}</a>
					: <span>{string(publisher)}</span>
			),

			"Contact": creator && <span>{string(creator)}</span>,

			"Contributor": contributor?.length && <ul>{[...contributor]
				.sort((x, y) => string(x).localeCompare(string(y)))
				.map(contributor => <li key={contributor.id}>{string(contributor)}</li>)
			}</ul>

		}}</DataInfo>

		<DataInfo>{{

			"License": license && (license.startsWith("http")
					? <a href={license}>{license.replace(/^https?:/, "")}</a>
					: <span>{license}</span>
			),

			"Rights": rights && <span>{string(creator)}</span>

		}}</DataInfo>

	</>;
}

function DataDocumentBody({

	children: {

		comment,

		relation

	}

}: {

	children: typeof Document

}) {

	return <DataCard>

		<ReactMarkdown

			remarkPlugins={[remarkGfm]}

		>{

			string(comment)

		}</ReactMarkdown>

		{relation?.length && <>

            <h1>Related Documents</h1>

            <ul>{[...relation]
				.sort((x, y) => string(x).localeCompare(string(y)))
				.map(relation => <li key={relation.id}>
					<NodeLink>{relation}</NodeLink>
				</li>)
			}</ul>

        </>}

	</DataCard>;

}
