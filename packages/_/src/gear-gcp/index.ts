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

import { immutable } from "@metreeca/core/values";
import { gcpMetadata, GoogleAuth } from "google-auth-library";


/**
 * Settings retained on first access.
 */
const cache: { -readonly [K in keyof typeof gcp]?: typeof gcp[K] } = {};


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * The Google Cloud Platform execution environment.
 *
 * Exposes the ambient settings shared by the Google Cloud integrations, such as whether the process is deployed to a
 * Google Cloud runtime, which port its HTTP service listens on and which project and region it runs in. Settings are
 * resolved on first access and retained afterwards, those looked up remotely asynchronously; all are exposed as a
 * deeply immutable object.
 *
 * @see {@link https://cloud.google.com/docs/authentication Google Cloud Authentication}
 */
export const gcp = immutable({

	/**
	 * Whether the current process is running on a managed Google Cloud runtime.
	 *
	 * The flag is set for a process deployed to a Google Cloud runtime; it is cleared for a process running locally,
	 * such as a development server or a test runner.
	 */
	get cloud(): boolean {
		return cache.cloud ??= process.env.K_SERVICE !== undefined
			|| process.env.CLOUD_RUN_JOB !== undefined
			|| process.env.GAE_ENV !== undefined;
	},

	/**
	 * The port an HTTP service is expected to listen on.
	 *
	 * The port is read from the `PORT` environment variable, which managed Google Cloud runtimes set to the port they
	 * route requests to; it defaults to `8080` if the variable is unset or empty.
	 */
	get port(): number {
		return cache.port ??= Number(process.env.PORT || 8080);
	},


	/**
	 * The ID of the Google Cloud project the process runs in.
	 *
	 * On a Google Cloud runtime the project is the one the process is deployed to; locally it is the one selected by
	 * the application default credentials or by the `gcloud` configuration. The promise rejects if no project is
	 * configured for the process.
	 */
	get project(): Promise<string> {
		return cache.project ??= new GoogleAuth().getProjectId();
	},

	/**
	 * The ID of the Google Cloud region the process is deployed to, for instance `europe-west1`.
	 *
	 * Only defined on a Google Cloud runtime (see {@link gcp.cloud}): a local process runs in no region, and the
	 * promise resolves to `undefined`.
	 */
	get region(): Promise<undefined | string> {
		return cache.region ??= !this.cloud ? Promise.resolve(undefined) : gcpMetadata
			.instance<string>("region") // projects/{number}/regions/{region}
			.then(path => path.replace(/^.*\//, ""));
	}

});
