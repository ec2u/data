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
 * @module Secret management utilities using Google Cloud Secret Manager.
 *
 * Automatically discovers the project ID using Google Cloud authentication and retrieves secrets from Secret Manager.
 *
 * @see {@link https://cloud.google.com/nodejs/docs/reference/secret-manager/latest} Secret Manager Node.js Client
 * @see {@link https://cloud.google.com/nodejs/docs/reference/secret-manager/latest/secret-manager/v1.secretmanagerserviceclient} SecretManagerServiceClient
 */

import { project } from "@/utilities/gcp/index";
import { SecretManagerServiceClient } from "@google-cloud/secret-manager";
import { error } from "@metreeca/core";

const client=new SecretManagerServiceClient();


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export async function secret(key: string): Promise<string> {
	try {

		const name=`projects/${project}/secrets/${key}/versions/latest`;
		const [version]=await client.accessSecretVersion({ name });
		const value=version.payload?.data?.toString();

		return value ?? error(`undefined secret <${key}>`);

	} catch ( e ) {
		throw error(`failed to access secret <${key}>: ${e}`);
	}
}
