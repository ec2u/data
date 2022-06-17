/*
 * Copyright © 2020-2022 Metreeca srl
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

import { Immutable, Primitive } from "@metreeca/core";
import { useEffect, useState } from "react";


/**
 * Search parameters string.
 */
export interface Parameters {

	readonly [key: string]: undefined | Primitive | Immutable<Primitive[]>;

}


export function useParameters<T extends Parameters=Parameters>(initial: T): [T, (parameters: T) => void] {

	const [state, setState]=useState({ ...(initial || {}), ...parameters() });

	useEffect(() => { parameters(state, initial); });

	return [state, setState];
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function parameters<T>(query?: Parameters, defaults?: Parameters): Parameters {
	if ( query === undefined ) { // getter

		const query={};

		new URLSearchParams(location.search.substring(1)).forEach((value, key) => {

			const current=(query as any)[key];

			(query as any)[key]=current === undefined ? value
				: Array.isArray(current) ? [...current, value]
					: [current, value];

		});

		return query;

	} else { // setter

		const params=new URLSearchParams();

		Object.entries(query).forEach(([key, values]) => (Array.isArray(values) ? values : [values])
			.filter(value => !(defaults && value === defaults[key]))
			.filter(value => !(key.startsWith(".") && !value))
			.forEach(value => params.append(key, String(value)))
		);

		const search=params.toString();

		history.replaceState(history.state, document.title,
			search ? `${location.pathname}?${search}${location.hash}` : `${location.pathname}${location.hash}`
		);

		return {};

	}
}