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


/**
 * The Google Cloud Platform execution environment.
 *
 * Exposes the ambient settings shared by the Google Cloud integrations, such as whether the process is deployed to a
 * Google Cloud runtime and which port its HTTP service listens on. Values are resolved once at module initialisation
 * and exposed as a deeply immutable object.
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
	cloud: process.env.K_SERVICE !== undefined
		|| process.env.CLOUD_RUN_JOB !== undefined
		|| process.env.GAE_ENV !== undefined,

	/**
	 * The port an HTTP service is expected to listen on.
	 *
	 * The port is read from the `PORT` environment variable, which managed Google Cloud runtimes set to the port they
	 * route requests to; it defaults to `8080` if the variable is unset or empty.
	 */
	port: Number(process.env.PORT || 8080)

});
