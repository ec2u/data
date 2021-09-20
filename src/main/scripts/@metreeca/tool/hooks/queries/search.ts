/*
 * Copyright © 2020-2021 Metreeca srl
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

import { Query, string, value } from "../../bases";
import { normalize } from "../../index";


export type Search=string;

export type SearchUpdater=(search: Search) => void


export function useSearch(
	path: string, [query, setQuery]: [Query, (query: Query) => void]
): [
	search: Search, setSearch: SearchUpdater
] {

	const like=`~${path}`;

	const search=string(value(query[like]));

	return [normalize(search), (search: string) =>
		setQuery({ ...query, [like]: normalize(search) })
	];

}
