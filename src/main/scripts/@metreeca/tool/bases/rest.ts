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

import { freeze } from "../index";
import { array, Frame, Graph, Query, State, string, url } from "./index";

export function RESTGraph(): Graph {

	const cache: { [url: string]: any }={}; // !!! TTL / size limits / …

	const observers=new Set<(frame?: Frame) => void>();


	function notify(frame?: Frame) {
		observers.forEach(observer => observer(frame));
	}


	return freeze({

		get<V extends Frame=Frame>(id: string, model: V, query?: Query): Promise<typeof model> {

			const key=url(id, query);

			return cache[key] || (cache[key]=fetch(key, {

				headers: { Accept: "application/json" } // !!! interceptor for session management

			})

				.then(response => response.json().then(json => {

					if ( response.ok ) {

						const value=freeze({ ...defaults(model), ...json }); // !!! fill missing properties from model

						notify(value);

						return value;

					} else {

						delete cache[key];

						throw freeze({

							status: response.status,
							reason: response.statusText,

							detail: json

						});

					}

				}))

				.catch(reason => { // !!! handle network/abort responses (see useFetcher)

					throw freeze({

						status: 0,
						reason: "fetch error",

						detail: reason

					});

				}));

		},


		post(id: string, state: State): Promise<string> {
			throw new Error("to be implemented"); //  !!! invalidate cache
		},

		put(id: string, state: State): Promise<void> {
			throw new Error("to be implemented"); //  !!! invalidate cache
		},

		delete(id: string): Promise<void> {
			throw new Error("to be implemented"); //  !!! invalidate cache
		},


		observe(id: string, model: Frame, observer: (frame?: Frame) => void): () => void {

			observers.add(observer);

			return () => observers.delete(observer);

		}

	});

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


/**
 * Recursively replaces model fields with their default value.
 *
 * @param model
 *
 * @return
 */
function defaults(model: any): any {
	if ( typeof model === "boolean" ) {

		return false;

	} else if ( typeof model === "number" ) {

		return 0;

	} else if ( typeof model === "string" ) {

		return "";

	} else if ( typeof model === "object" ) {

		return Object.getOwnPropertyNames(model).reduce((object: any, key) => {

			object[key]=defaults((model as any)[key]);

			return object;

		}, {});

	} else if ( array(model) ) {

		return [];

	} else {

		return model;

	}
}
