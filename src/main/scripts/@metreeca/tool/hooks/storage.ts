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

import { useEffect, useState } from "react";
import { Initial, Updater } from "./index";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function useStorage<T=any>(persist: boolean, key: string, initial: Initial<T>): [T, Updater<T>] {

	const storage=persist ? localStorage : sessionStorage;

	const item=storage.getItem(key);

	const [state, setState]=useState<T>(item === null ? initial : JSON.parse(item));

	useEffect(() => state === undefined

			? storage.removeItem(key)
			: storage.setItem(key, JSON.stringify(state)),

		[state]
	);

	return [state, setState];

}