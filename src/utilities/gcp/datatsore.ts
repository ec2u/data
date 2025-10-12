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
 * @module DatastoreUtils
 *
 * Provides utility methods for Google Cloud Datastore operations.
 */

import { log, message } from "@/utilities/core/log";
import { project } from "@/utilities/gcp/index";
import { Datastore } from "@google-cloud/datastore";

export const datastore=new Datastore({
	projectId: project
});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Deletes all entities of a specific kind from Datastore.
 *
 * @param kind The Datastore kind to delete all entities from
 */
export async function clear(kind: string): Promise<void> {
	try {

		log.info(clear.name, `deleting all entities of kind <${kind}>`);

		const [entities]=await datastore.runQuery(datastore.createQuery(kind).select("__key__"));

		if ( entities.length === 0 ) {
			log.info(clear.name, `no entities found for kind <${kind}>`);
			return;
		}

		const keys=entities.map(entity => entity[datastore.KEY]);
		const batchSize=500; // Datastore limit

		for (let i=0; i < keys.length; i+=batchSize) {
			await datastore.delete(keys.slice(i, i+batchSize));
		}

		log.info(clear.name, `deleted ${entities.length} entities of kind <${kind}>`);

	} catch ( e ) {

		log.error(clear.name, `unable to delete entities of kind <${kind}>: ${message(e)}`);

		throw e;

	}
}
