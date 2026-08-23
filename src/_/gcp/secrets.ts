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
 * Google Cloud Secret Manager integration.
 *
 * Provides {@link secret}, a reader for the secrets of the project the process is authenticated against; the project
 * is discovered from the ambient Google Cloud credentials, with no explicit configuration required.
 *
 * @module
 *
 * @see {@link https://cloud.google.com/nodejs/docs/reference/secret-manager/latest Secret Manager Node.js Client}
 * @see {@link https://cloud.google.com/nodejs/docs/reference/secret-manager/latest/secret-manager/v1.secretmanagerserviceclient SecretManagerServiceClient}
 */

import { SecretManagerServiceClient } from "@google-cloud/secret-manager";
import { error } from "@metreeca/core";

const client=new SecretManagerServiceClient();


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Reads a secret.
 *
 * Retrieves the payload of the latest version of a secret from the Secret Manager of the project the process is
 * authenticated against.
 *
 * @param key The name of the secret to be read
 *
 * @returns A promise resolving to the textual payload of the latest version of the secret named `key`
 *
 * @throws Error If the secret is not accessible or its latest version carries no payload
 */
export async function secret(key: string): Promise<string> {
	try {

		const name=client.secretVersionPath(await client.getProjectId(), key, "latest");
		const [version]=await client.accessSecretVersion({ name });
		const value=version.payload?.data?.toString();

		return value ?? error(`undefined secret <${key}>`);

	} catch ( e ) {
		throw error(`failed to access secret <${key}>: ${e}`);
	}
}
