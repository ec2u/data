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

	label: required(local),
	comment: optional(local),

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

	owner: optional({
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

	return <DataPage name={[Documents, document]}

		tray={<ToolFrame as={({

			label,

			url,

			identifier,
			language,

			issued,
			modified,
			valid,

			owner,

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

				"Owner": owner && <ToolLink>{owner}</ToolLink>

			}}</ToolInfo>

			<ToolInfo>{{

				"Code": identifier && <span>{identifier}</span>,

				"Title": <span>{toLocalString(label)}</span>,

				"Web": url?.length && url.map(item =>
					<a key={item} href={item}>{toIdString(item, { compact: true })}</a>
				),

				"Language": language?.length && language.map(item => <span
					key={item}>{toLocalString(Languages[item])}</span>)

			}}</ToolInfo>

			<ToolInfo>{{

				"Type": type && type.length && <ul>{sortFrames(type).map(type =>
					<li key={type.id}>
						<ToolLink filter={[Documents, { owner, subject: type }]}>{type}</ToolLink>
					</li>
				)}</ul>,

				"Audience": audience && audience.length && <ul>{sortFrames(audience).map(audience =>
					<li key={audience.id}>
						<ToolLink filter={[Documents, { owner, audience }]}>{audience}</ToolLink>
					</li>
				)}</ul>,

				"Topics": subject && subject.length && <ul>{sortFrames(subject).map(subject =>
					<li key={subject.id}>
						<ToolLink filter={[Documents, { owner, subject }]}>{subject}</ToolLink>
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

			comment,

			relation

		}) => <>

			{comment && <ToolMark>{

				comment && toLocalString(comment)

			}</ToolMark>}

			{relation?.length && <>

                <h1>Related Documents</h1>

                <ul>{sortFrames(relation).map(relation => <li key={relation.id}>
						<ToolLink>{relation}</ToolLink>
					</li>
				)}</ul>

            </>}


		</>}>{document}</ToolFrame>

	</DataPage>;

}