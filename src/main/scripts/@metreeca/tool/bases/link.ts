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
import { Frame, Graph, State } from "./index";

export function LinkGraph(): Graph {

	const cache: { [url: string]: Frame }={}; // !!! TTL / size limits / …

	const observers=new Set<(frame?: Frame) => void>();


	function notify(frame?: Frame) {
		observers.forEach(observer => observer(frame));
	}


	return freeze({

		get(id: string, model: Frame): Promise<typeof model> {

			return fetch(id, {

				headers: { Accept: "application/json" } // !!! interceptor for session management

			})

				.then(response => response.json().then(json => {

					if ( response.ok ) {

						const value=freeze({ ...prune(model), ...json }); // !!! fill missing properties from model

						notify(value);

						return value as typeof model;


					} else {

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

				});

		},


		post(id: string, state: State): Promise<string> {
			throw new Error("to be implemented");
		},

		put(id: string, state: State): Promise<void> {
			throw new Error("to be implemented");
		},

		delete(id: string): Promise<void> {
			throw new Error("to be implemented");
		},


		observe(id: string, model: Frame, observer: (frame?: Frame) => void): () => void {

			observers.add(observer);

			return () => observers.delete(observer);

		}

	});

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


function prune<T>(model: any): any { // !!! generic type
	if ( Array.isArray(model) ) {

		return [];

	} else if ( typeof model === "object" ) {

		return Object.getOwnPropertyNames(model).reduce((object: any, key) => {

			object[key]=prune(model[key]);

			return object;

		}, {});

	} else {

		return model;

	}
}
