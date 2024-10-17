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
import { DataInfo } from "@ec2u/data/pages/datasets/dataset";
import { DataPage } from "@ec2u/data/views/page";
import { immutable, multiple, optional, required } from "@metreeca/core";
import { boolean } from "@metreeca/core/boolean";
import { decimal } from "@metreeca/core/decimal";
import { duration, toDurationString } from "@metreeca/core/duration";
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
import { ToolOptions } from "@metreeca/view/lenses/options";
import { ToolRange } from "@metreeca/view/lenses/range";
import { ToolSheet } from "@metreeca/view/lenses/sheet";
import { ToolCard } from "@metreeca/view/widgets/card";
import { BookOpen } from "@metreeca/view/widgets/icon";
import { ToolLink } from "@metreeca/view/widgets/link";
import { ToolSearch } from "@metreeca/view/widgets/search";
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

		university: optional({
				id: required(id),
				label: required(local)
			}
		)

	})

});


export function DataCourses() {

	const courses=useCollection(Courses, "members");

	return <DataPage name={Courses} menu={<DataInfo/>}

		tray={< >

			<ToolSearch placeholder={"Name"}>{
				useKeywords(courses, "label")
			}</ToolSearch>

			<ToolOptions placeholder={"University"}>{
				useOptions(courses, "university", { type: entry({ id: "", label: required(local) }) })
			}</ToolOptions>

			<ToolOptions placeholder={"Level"}>{
				useOptions(courses, "educationalLevel", { type: entry({ id: "", label: required(local) }) })
			}</ToolOptions>

			<ToolOptions placeholder={"Language"} compact as={value => toLocalString(Languages[value])}>{
				useOptions(courses, "inLanguage", { type: string })
			}</ToolOptions>

			<ToolOptions placeholder={"Attendance"} compact>{
				useOptions(courses, "courseMode", { type: entry({ id: "", label: required(local) }) })
			}</ToolOptions>

			<ToolOptions placeholder={"Duration"} compact as={value => toDurationString(duration.decode(value))}>{
				useOptions(courses, "timeRequired", { type: string, size: 10 }) // !!! duration >> range
			}</ToolOptions>

			<ToolRange placeholder={"Credits"} compact>{
				useRange(courses, "numberOfCredits", { type: decimal })
			}</ToolRange>

			<ToolOptions placeholder={"Title Awarded"} compact>{
				useOptions(courses, "educationalCredentialAwarded", { type: local, size: 10 })
			}</ToolOptions>

			<ToolOptions placeholder={"Audience"} compact>{
				useOptions(courses, "audience", { type: string })
			}</ToolOptions>

			<ToolOptions placeholder={"Free for Externals"} compact>{
				useOptions(courses, "isAccessibleForFree", { type: boolean })
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
				tags={university && <span>{toEntryString(university)}</span>}

			>{

				comment && toLocalString(comment)

			}</ToolCard>

		}>{courses}</ToolSheet>


	</DataPage>;
}

