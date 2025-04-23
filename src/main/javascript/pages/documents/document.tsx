/*
 * Copyright © 2020-2025 EC2U Alliance
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
import { DataAI } from "@ec2u/data/views/ai";
import { DataPage } from "@ec2u/data/views/page";
import { immutable, multiple, optional, required } from "@metreeca/core";
import { boolean } from "@metreeca/core/boolean";
import { toDateString } from "@metreeca/core/date";
import { dateTime } from "@metreeca/core/dateTime";
import { toEntryString } from "@metreeca/core/entry";
import { sortFrames } from "@metreeca/core/frame";
import { id, toIdString } from "@metreeca/core/id";
import { string } from "@metreeca/core/string";
import { text, toTextString } from "@metreeca/core/text";
import { useResource } from "@metreeca/data/models/resource";
import { icon } from "@metreeca/view";
import { TileFrame } from "@metreeca/view/lenses/frame";
import { TileInfo } from "@metreeca/view/widgets/info";
import { TileLink } from "@metreeca/view/widgets/link";
import { TileMark } from "@metreeca/view/widgets/mark";
import React from "react";

export const Document=immutable({

	id: required("/documents/{code}"),

	generated: optional(boolean),

	title: required(text),
	description: optional(text),

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
		label: required(text)
	}),

	university: optional({
			id: required(id),
		label: required(text)
		}
	),

	publisher: optional({
		id: required(id),
		label: required(text),
		homepage: optional(string)
	}),

	creator: optional({
		id: required(id),
		label: required(text)
	}),

	contributor: multiple({
		id: required(id),
		label: required(text)
	}),

	audience: multiple({
		id: required(id),
		label: required(text)
	}),

	relation: multiple({
		id: required(id),
		label: required(text)
	}),

	subject: multiple({
		id: required(id),
		label: required(text)
	})

});


export function DataDocument() {

	const [document]=useResource(Document);

	return <DataPage name={[Documents, {}]} info={<DataAI>{document?.generated}</DataAI>}

		tray={<TileFrame as={({

			url,

			identifier,
			language,

			issued,
			modified,
			valid,

			university,

			type,
			subject,
			audience,

			publisher,
			creator,
			contributor,

			license,
			rights

		}) => <>

			<TileInfo>{{

				"University": university && <TileLink>{university}</TileLink>

			}}</TileInfo>

			<TileInfo>{{

				"Code": identifier && <span>{identifier}</span>,

				"Web": url?.length && <ul>{url.map(item =>
					<li key={item}><a href={item}>{toIdString(item, { compact: true })}</a></li>
				)}</ul>,

				"Language": language?.length && <ul>{language.map(item =>
					<li key={item}><span>{toTextString(Languages[item])}</span></li>
				)}</ul>
			}}</TileInfo>

			<TileInfo>{{

				"Type": type && type.length && <ul>{sortFrames(type).map(type =>
					<li key={type.id}>
						<TileLink filter={[Documents, { university, subject: type }]}>{type}</TileLink>
					</li>
				)}</ul>,

				"Audience": audience && audience.length && <ul>{sortFrames(audience).map(audience =>
					<li key={audience.id}>
						<TileLink filter={[Documents, { university, audience }]}>{audience}</TileLink>
					</li>
				)}</ul>,

				"Topics": subject && subject.length && <ul>{sortFrames(subject).map(subject =>
					<li key={subject.id}>
						<TileLink filter={[Documents, { university, subject }]}>{subject}</TileLink>
					</li>
				)}</ul>

			}}</TileInfo>

			<TileInfo>{{

				"Issued": issued && toDateString(new Date(issued)),
				"Updated": modified && toDateString(new Date(modified)),
				"Valid": valid

			}}</TileInfo>

			<TileInfo>{{

				"Publisher": publisher && (publisher.homepage
						? <a href={publisher.homepage}>{toEntryString(publisher)}</a>
						: <span>{toEntryString(publisher)}</span>
				),

				"Contact": creator && <span>{toEntryString(creator)}</span>,

				"Contributor": contributor?.length && <ul>{sortFrames(contributor)
					.map(contributor => <li key={contributor.id}>{toEntryString(contributor)}</li>)
				}</ul>

			}}</TileInfo>

			<TileInfo>{{

				"License": license && (license.startsWith("http")
						? <a href={license}>{license.replace(/^https?:/, "")}</a>
						: <span>{license}</span>
				),

				"Rights": rights && <span>{rights}</span>

			}}</TileInfo>

		</>}>{document}</TileFrame>}

	>

		<TileFrame placeholder={Events[icon]} as={({

			title,
			description,

			relation

		}) => <>

			<dfn>{toTextString(title)}</dfn>

			{description && <TileMark>{toTextString(description)}</TileMark>}

			{relation && <>

                <h1>Related Documents</h1>

                <ul>{sortFrames(relation).map(relation => <li key={relation.id}>
					<TileLink>{relation}</TileLink>
					</li>
				)}</ul>

            </>}


		</>}>{document}</TileFrame>

	</DataPage>;

}