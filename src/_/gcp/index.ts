/*
 * Copyright © 2026 Metreeca srl
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
 * Google Cloud Platform integrations.
 *
 * Provides {@link gcp}, a descriptor of the ambient Google Cloud execution environment.
 *
 * @module
 *
 * @see {@link https://cloud.google.com/docs Google Cloud Documentation}
 */

import { immutable } from "@metreeca/core/structures";
import { GoogleAuth } from "google-auth-library";


/**
 * The Google Cloud Platform execution environment.
 *
 * Reports the ambient settings shared by the Google Cloud integrations, that is the project the process is
 * authenticated against and the kind of runtime it is deployed to. Values are resolved once at module initialisation
 * and exposed as a deeply immutable object.
 *
 * @see {@link https://cloud.google.com/docs/authentication Google Cloud Authentication}
 */
export const gcp = immutable({

	/**
	 * The Google Cloud project ID resolved from the authenticated environment.
	 *
	 * Resolved at module initialisation, probing in order the `GCLOUD_PROJECT` and `GOOGLE_CLOUD_PROJECT` variables,
	 * the credentials file named by `GOOGLE_APPLICATION_CREDENTIALS`, the local `gcloud` configuration, and the
	 * Google Cloud metadata server.
	 *
	 * @remarks
	 *
	 * Outside a deployed service the `gcloud` step spawns the Cloud SDK and takes on the order of a second, unless
	 * one of the project variables is defined; module initialisation fails if no project ID is found.
	 */
	project: await new GoogleAuth().getProjectId(),

	/**
	 * Whether the current process is running in the development environment.
	 *
	 * true if the process is running outside a deployed service, for instance under a local development server or a
	 * test runner; false otherwise.
	 *
	 * @remarks
	 *
	 * Managed Google Cloud runtimes assign the serving port through the `PORT` environment variable: an undefined
	 * value identifies a process running outside a deployed service.
	 */
	development: process.env.PORT === undefined

});
