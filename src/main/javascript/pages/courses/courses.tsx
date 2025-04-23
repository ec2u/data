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
import { DataInfo } from "@ec2u/data/pages/datasets/dataset";
import { DataPage } from "@ec2u/data/views/page";
import { immutable, multiple, optional, required } from "@metreeca/core";
import { boolean } from "@metreeca/core/boolean";
import { decimal } from "@metreeca/core/decimal";
import { duration, toDurationString } from "@metreeca/core/duration";
import { entry, toEntryString } from "@metreeca/core/entry";
import { id } from "@metreeca/core/id";
import { string } from "@metreeca/core/string";
import { text, toTextString } from "@metreeca/core/text";
import { useCollection } from "@metreeca/data/models/collection";
import { useKeywords } from "@metreeca/data/models/keywords";
import { useOptions } from "@metreeca/data/models/options";
import { useRange } from "@metreeca/data/models/range";
import { useStats } from "@metreeca/data/models/stats";
import { icon } from "@metreeca/view";
import { TileClear } from "@metreeca/view/lenses/clear";
import { TileCount } from "@metreeca/view/lenses/count";
import { TileOptions } from "@metreeca/view/lenses/options";
import { TileRange } from "@metreeca/view/lenses/range";
import { TileSheet } from "@metreeca/view/lenses/sheet";
import { TileCard } from "@metreeca/view/widgets/card";
import { BookOpen } from "@metreeca/view/widgets/icon";
import { TileLink } from "@metreeca/view/widgets/link";
import { TileSearch } from "@metreeca/view/widgets/search";
import * as React from "react";

export const Courses=immutable({

	[icon]: <BookOpen/>,

	id: required("/courses/"),

	label: required({
		"en": "Courses"
	}),

	members: multiple({

		id: required(id),
		label: required(text),
		comment: optional((text)),

		university: optional({
				id: required(id),
			label: required(text)
			}
		)

	})

});


export function DataCourses() {

	const courses=useCollection(Courses, "members");

	return <DataPage name={Courses} menu={<DataInfo/>}

		tray={< >

			<TileSearch placeholder={"Name"}>{
				useKeywords(courses, "label")
			}</TileSearch>

			<TileOptions placeholder={"University"}>{
				useOptions(courses, "university", { type: entry({ id: "", label: required(text) }) })
			}</TileOptions>

			<TileOptions placeholder={"Level"}>{
				useOptions(courses, "educationalLevel", { type: entry({ id: "", label: required(text) }) })
			}</TileOptions>

			<TileOptions placeholder={"Language"} compact as={value => toTextString(Languages[value])}>{
				useOptions(courses, "inLanguage", { type: string })
			}</TileOptions>

			<TileOptions placeholder={"Attendance"} compact>{
				useOptions(courses, "courseMode", { type: entry({ id: "", label: required(text) }) })
			}</TileOptions>

			<TileOptions placeholder={"Duration"} compact as={value => toDurationString(duration.decode(value))}>{
				useOptions(courses, "timeRequired", { type: string, size: 10 }) // !!! duration >> range
			}</TileOptions>

			<TileRange placeholder={"Credits"} compact>{
				useRange(courses, "numberOfCredits", { type: decimal })
			}</TileRange>

			<TileOptions placeholder={"Title Awarded"} compact>{
				useOptions(courses, "educationalCredentialAwarded", { type: text, size: 10 })
			}</TileOptions>

			<TileOptions placeholder={"Audience"} compact>{
				useOptions(courses, "audience", { type: string })
			}</TileOptions>

			<TileOptions placeholder={"Free for Externals"} compact>{
				useOptions(courses, "isAccessibleForFree", { type: boolean })
			}</TileOptions>

		</>}

		info={<>

			<TileCount>{useStats(courses)}</TileCount>
			<TileClear>{courses}</TileClear>

		</>}

	>
		<TileSheet placeholder={Courses[icon]} as={({

			id,
			label,
			comment,

			university

		}) =>

			<TileCard key={id} side={"end"}

				title={<TileLink>{{ id, label }}</TileLink>}
				tags={university && <span>{toEntryString(university)}</span>}

			>{

				comment && toTextString(comment)

			}</TileCard>

		}>{courses}</TileSheet>


	</DataPage>;
}

