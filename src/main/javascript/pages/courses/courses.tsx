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
import { DataMeta } from "@ec2u/data/pages/datasets/dataset";
import { DataPage } from "@ec2u/data/views/page";
import { immutable, multiple, optional, required } from "@metreeca/core";
import { decimal } from "@metreeca/core/decimal";
import { entry, toEntryString } from "@metreeca/core/entry";
import { id } from "@metreeca/core/id";
import { local, toLocalString } from "@metreeca/core/local";
import { string } from "@metreeca/core/string";
import { useCollection } from "@metreeca/data/models/collection";
import { useKeywords } from "@metreeca/data/models/keywords";
import { useOptions } from "@metreeca/data/models/options";
import { useRange } from "@metreeca/data/models/range";
import { useStats } from "@metreeca/data/models/stats";
import { icon } from "@metreeca/view";
import { ToolClear } from "@metreeca/view/lenses/clear";
import { ToolCount } from "@metreeca/view/lenses/count";
import { ToolKeywords } from "@metreeca/view/lenses/keywords";
import { ToolOptions } from "@metreeca/view/lenses/options";
import { ToolRange } from "@metreeca/view/lenses/range";
import { ToolSheet } from "@metreeca/view/lenses/sheet";
import { ToolCard } from "@metreeca/view/widgets/card";
import { BookOpen } from "@metreeca/view/widgets/icon";
import { ToolLink } from "@metreeca/view/widgets/link";
import * as React from "react";

export const Courses=immutable({

	[icon]: <BookOpen/>,

	id: required("/courses/"),

	label: required({
		"en": "Courses"
	}),

	members: multiple({

		id: required(id),
		label: required(local),
		comment: optional((local)),

		university: required({
				id: required(id),
				label: required(local)
			}
		)

	})

});


export function DataCourses() {

	const courses=useCollection(Courses, "members");

	return <DataPage name={Courses} menu={<DataMeta/>}

		tray={< >

			<ToolKeywords placeholder={"Name"}>{
				useKeywords(courses, "label")
			}</ToolKeywords>

			<ToolOptions placeholder={"University"}>{
				useOptions(courses, "university", { type: entry({ id: "", label: required(local) }) })
			}</ToolOptions>

			<ToolOptions placeholder={"Level"}>{
				useOptions(courses, "educationalLevel", { type: entry({ id: "", label: required(local) }) })
			}</ToolOptions>

			<ToolRange placeholder={"Credits"}>{
				useRange(courses, "numberOfCredits", { type: decimal })
			}</ToolRange>

			<ToolOptions placeholder={"Language"} compact as={value => toLocalString(Languages[value])}>{
				useOptions(courses, "inLanguage", { type: string })
			}</ToolOptions>

			<ToolOptions placeholder={"Duration"} compact>{
				useOptions(courses, "timeRequired", { type: string, size: 10 }) // !!! duration >> range
			}</ToolOptions>

			<ToolOptions placeholder={"Title Awarded"} compact>{
				useOptions(courses, "educationalCredentialAwarded", { type: local, size: 10 })
			}</ToolOptions>

			<ToolOptions placeholder={"Provider"} compact>{
				useOptions(courses, "provider", { type: entry({ id: "", label: required(local) }), size: 10 })
			}</ToolOptions>

		</>}

		info={<>

			<ToolCount>{useStats(courses)}</ToolCount>
			<ToolClear>{courses}</ToolClear>

		</>}

	>
		<ToolSheet placeholder={Courses[icon]} as={({

			id,
			label,
			comment,

			university

		}) =>


			<ToolCard key={id} side={"end"}

				title={<ToolLink>{{ id, label }}</ToolLink>}
				tags={<span>{toEntryString(university)}</span>}

			>{

				comment && toLocalString(comment)

			}</ToolCard>

		}>{courses}</ToolSheet>


	</DataPage>;
}

