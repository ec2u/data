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

/**
 * @module FirebaseCache
 *
 * Provides Firebase Firestore-backed cache implementation for persistent,
 * distributed caching across multiple instances.
 */

import { hash } from "@/core";
import { Cache } from "@/core/cache";
import { Firestore } from "@google-cloud/firestore";
import { GoogleAuth } from "google-auth-library";

const auth=new GoogleAuth();

/**
 * Creates a Firebase Firestore-backed cache implementation.
 *
 * Values are stored in Firestore and can be shared across multiple instances.
 * This implementation provides persistence, distribution, and automatic
 * deduplication of concurrent requests for the same key.
 *
 * @template T The type of values to cache
 *
 * @param config Configuration options for the Firebase cache
 * @param config.database Firestore database ID (default: "(default)")
 * @param config.collection Firestore collection name for cache entries (default: "cache")
 *
 * @returns A cache instance that persists values to Firestore
 */
export function FirebaseCache<T>({

	collection="cache",
	database="(default)"

}: {

	collection?: string;
	database?: string;

}={}): Cache<T> {

	const pending=new Map<string, Promise<T>>();

	let db: null | Firestore=null;

	async function getFirestore() {

		if ( !db ) {
			try {

				db=new Firestore({
					projectId: await auth.getProjectId(),
					databaseId: database
				});

			} catch ( e ) {
				const message=e instanceof Error ? e.message : String(e);
				throw new Error(`failed to initialize Firestore database <${database}>: ${message}`);
			}
		}

		return db;
	}

	return {

		async lookup(key: string, generator: (key: string) => Promise<T>): Promise<T> {

			const docId=hash(key);
			const work=pending.get(key);

			if ( work ) {
				return work;
			}

			const promise=new Promise<T>(async (resolve, reject) => {

				try {

					const firestore=await getFirestore();
					const docRef=firestore.collection(collection).doc(docId);
					const doc=await docRef.get();

					if ( doc.exists ) {
						const data=doc.data();
						if ( data && data.value !== undefined ) {
							resolve(data.value);
							return;
						}
					}

					// Generate new value
					const value=await generator(key);

					// Store in Firestore
					await docRef.set({
						key,
						value,
						timestamp: new Date(),
						hash: docId
					});

					resolve(value);

				} catch ( e ) {

					const message=e instanceof Error ? e.message : String(e);
					console.error(`Firebase cache error for <${key}>: ${message}`);

					reject(e);

				}
			});

			pending.set(key, promise);

			return promise.finally(() => {
				pending.delete(key);
			});
		}

	};

}
