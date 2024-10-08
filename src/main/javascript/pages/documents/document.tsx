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


import { Languages } from "@ec2u/data/languages";
import { Documents } from "@ec2u/data/pages/documents/documents";
import { Events } from "@ec2u/data/pages/events/events";
import { DataPage } from "@ec2u/data/views/page";
import { immutable, multiple, optional, required } from "@metreeca/core";
import { toDateString } from "@metreeca/core/date";
import { dateTime } from "@metreeca/core/dateTime";
import { toEntryString } from "@metreeca/core/entry";
import { sortFrames } from "@metreeca/core/frame";
import { id, toIdString } from "@metreeca/core/id";
import { local, toLocalString } from "@metreeca/core/local";
import { string } from "@metreeca/core/string";
import { useResource } from "@metreeca/data/models/resource";
import { icon } from "@metreeca/view";
import { ToolFrame } from "@metreeca/view/lenses/frame";
import { ToolInfo } from "@metreeca/view/widgets/info";
import { ToolLink } from "@metreeca/view/widgets/link";
import { ToolMark } from "@metreeca/view/widgets/mark";
import React from "react";

export const Document=immutable({

	id: required("/documents/{code}"),

	title: required(local),
	description: optional(local),

	url: multiple(string),

	identifier: optional(string),
	language: multiple(string),

	license: optional(string),
	rights: optional(string),

	issued: optional(dateTime),
	modified: optional(dateTime),
	valid: optional(dateTime),

	type: multiple({
		id: required(id),
		label: required(local)
	}),

	partner: optional({
			id: required(id),
			label: required(local)
		}
	),

	publisher: optional({
		id: required(id),
		label: required(local),
		homepage: optional(string)
	}),

	creator: optional({
		id: required(id),
		label: required(local)
	}),

	contributor: multiple({
		id: required(id),
		label: required(local)
	}),

	audience: multiple({
		id: required(id),
		label: required(local)
	}),

	relation: multiple({
		id: required(id),
		label: required(local)
	}),

	subject: multiple({
		id: required(id),
		label: required(local)
	})

});


export function DataDocument() {

	const [document]=useResource(Document);

	return <DataPage name={[Documents, {}]}

		tray={<ToolFrame as={({

			url,

			identifier,
			language,

			issued,
			modified,
			valid,

			partner,

			type,
			subject,
			audience,

			publisher,
			creator,
			contributor,

			license,
			rights

		}) => <>

			<ToolInfo>{{

				"University": partner && <ToolLink>{partner}</ToolLink>

			}}</ToolInfo>

			<ToolInfo>{{

				"Code": identifier && <span>{identifier}</span>,

				"Web": url?.length && <ul>{url.map(item =>
					<li key={item}><a href={item}>{toIdString(item, { compact: true })}</a></li>
				)}</ul>,

				"Language": language?.length && <ul>{language.map(item =>
					<li key={item}><span>{toLocalString(Languages[item])}</span></li>
				)}</ul>
			}}</ToolInfo>

			<ToolInfo>{{

				"Type": type && type.length && <ul>{sortFrames(type).map(type =>
					<li key={type.id}>
						<ToolLink filter={[Documents, { partner, subject: type }]}>{type}</ToolLink>
					</li>
				)}</ul>,

				"Audience": audience && audience.length && <ul>{sortFrames(audience).map(audience =>
					<li key={audience.id}>
						<ToolLink filter={[Documents, { partner, audience }]}>{audience}</ToolLink>
					</li>
				)}</ul>,

				"Topics": subject && subject.length && <ul>{sortFrames(subject).map(subject =>
					<li key={subject.id}>
						<ToolLink filter={[Documents, { partner, subject }]}>{subject}</ToolLink>
					</li>
				)}</ul>

			}}</ToolInfo>

			<ToolInfo>{{

				"Issued": issued && toDateString(new Date(issued)),
				"Updated": modified && toDateString(new Date(modified)),
				"Valid": valid

			}}</ToolInfo>

			<ToolInfo>{{

				"Publisher": publisher && (publisher.homepage
						? <a href={publisher.homepage}>{toEntryString(publisher)}</a>
						: <span>{toEntryString(publisher)}</span>
				),

				"Contact": creator && <span>{toEntryString(creator)}</span>,

				"Contributor": contributor?.length && <ul>{sortFrames(contributor)
					.map(contributor => <li key={contributor.id}>{toEntryString(contributor)}</li>)
				}</ul>

			}}</ToolInfo>

			<ToolInfo>{{

				"License": license && (license.startsWith("http")
						? <a href={license}>{license.replace(/^https?:/, "")}</a>
						: <span>{license}</span>
				),

				"Rights": rights && <span>{rights}</span>

			}}</ToolInfo>

		</>}>{document}</ToolFrame>}

	>

		<ToolFrame placeholder={Events[icon]} as={({

			title,
			description,

			relation

		}) => <>

			<dfn>{toLocalString(title)}</dfn>

			{description && <ToolMark>{toLocalString(description)}</ToolMark>}

			{relation && <>

                <h1>Related Documents</h1>

                <ul>{sortFrames(relation).map(relation => <li key={relation.id}>
						<ToolLink>{relation}</ToolLink>
					</li>
				)}</ul>

            </>}


		</>}>{document}</ToolFrame>

	</DataPage>;

}