/*
 * Copyright © 2025 Metreeca srl
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

import { hash } from "@/core/index";
import { existsSync, promises as fs } from "fs";
import { join } from "path";

export interface Cache<T> {

	lookup(url: string, generator: (url: string) => Promise<T>): Promise<T>;

}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function HeapCache<T>(): Cache<T> {

	const cache=new Map<string, T>();

	return {

		async lookup(url: string, generator: (url: string) => Promise<T>): Promise<T> {

			const cached=cache.get(url);

			if ( cached !== undefined ) {

				return cached;

			} else {

				const value=await generator(url);

				cache.set(url, value);

				return value;

			}
		}

	};
}


export function DiskCache<T>({

	path=".cache"

}: Partial<{

	path: string

}>={}): Cache<T> {

	const pending=new Map<string, Promise<T>>();

	return {

		async lookup(url: string, generator: (url: string) => Promise<T>): Promise<T> {

			const file=join(path, `${(hash(url))}.json`);
			const work=pending.get(url);


			async function cleanup(): Promise<void> {
				try {

					if ( existsSync(file) ) {
						await fs.unlink(file);
					}

				} catch ( e ) {
					console.error(`unable to remove partial cache file for <${url}> at <${file}>: ${e instanceof Error ? e.message : String(e)}`);
				}
			}


			if ( work ) {

				return work;

			} else if ( existsSync(file) ) {

				try {

					return JSON.parse(await fs.readFile(file, "utf8"));

				} catch ( e ) {

					console.error(`corrupted cache entry for <${url}> at <${file}>: ${e instanceof Error ? e.message : String(e)}`);

					throw e;
				}

			} else {

				const promise=new Promise<T>(async (resolve, reject) => {

					try {

						const value=await generator(url);

						try {

							await fs.mkdir(path, { recursive: true });
							await fs.writeFile(file, JSON.stringify(value, null, 2));

							resolve(value);

						} catch ( e ) {

							console.error(`unable to write cache entry for <${url}> at <${file}>: ${e instanceof Error ? e.message : String(e)}`);

							await cleanup();

							reject(e);

						}

					} catch ( e ) {

						console.error(`unable to generate cache value for <${url}> at <${file}>: ${e instanceof Error ? e.message : String(e)}`);

						await cleanup();

						reject(e);

					}
				});

				pending.set(url, promise);

				return promise.finally(() => {
					pending.delete(url);
				});
			}
		}

	};

}
