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
 * @remarks
 *
 * Secrets are read from the project the ambient credentials resolve to and no other: no configuration is available to
 * target a different project, so a task reading its secrets has to be executed under credentials for that project.
 *
 * The Secret Manager client is created when the module is first imported and retained for the lifetime of the process:
 * the gRPC channel it opens is never closed, so a short-lived task may have to exit explicitly, rather than wait for
 * the event loop to drain.
 *
 * @see {@link https://cloud.google.com/nodejs/docs/reference/secret-manager/latest Secret Manager Node.js Client}
 * @see {@link https://cloud.google.com/nodejs/docs/reference/secret-manager/latest/secret-manager/v1.secretmanagerserviceclient SecretManagerServiceClient}
 */

import { SecretManagerServiceClient } from "@google-cloud/secret-manager";
import { error } from "@metreeca/core";
import { Vault } from "@metreeca/flow/vault";

const client=new SecretManagerServiceClient();

/**
 * The gRPC status code reporting a secret or a secret version that doesn't exist.
 *
 * @see {@link https://grpc.io/docs/guides/status-codes/ gRPC status codes}
 */
const NOT_FOUND=5;


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates a Secret Manager vault.
 *
 * Parameters are looked up among the secrets of the project the process is authenticated against as each request is
 * served, so that a secret created or rotated after the vault was constructed is reported as well; the latest version
 * of the secret is retrieved, as {@link secret} defines.
 *
 * @returns A vault retrieving parameters from the Secret Manager of the project the process is authenticated against
 */
export function createGCPVault(): Vault {

	return secret;

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Reads a secret.
 *
 * Retrieves the payload of the latest version of a secret from the Secret Manager of the project the process is
 * authenticated against.
 *
 * Secret names are limited to letters, digits, underscores and hyphens: a `key` carrying any other character names no
 * secret and is reported as a failure.
 *
 * @param key The name of the secret to be read
 *
 * @returns A promise resolving to the textual payload of the latest version of the secret named `key`
 *
 * @throws Error If `key` names no secret, if the secret is not accessible, or if its latest version carries no payload
 *
 * @see {@link https://cloud.google.com/secret-manager/docs/creating-and-accessing-secrets Accessing secrets}
 */
export async function secret(key: string): Promise<string> {

	try {

		const name=client.secretVersionPath(await client.getProjectId(), key, "latest");
		const [version]=await client.accessSecretVersion({ name });
		const value=version.payload?.data?.toString();

		return value ?? error(`undefined secret <${key}>`);

	} catch ( e ) {

		if ( missing(e) ) {

			throw error(`unknown secret <${key}>`);

		} else {

			throw error(`failed to access secret <${key}>: ${e}`);

		}

	}

	/**
	 * Checks if a failure reports a missing secret.
	 *
	 * @param cause The failure reported while accessing a secret
	 *
	 * @returns `true` if `cause` carries the {@link NOT_FOUND} gRPC status code; `false` otherwise
	 */
	function missing(cause: unknown): boolean {

		return typeof cause === "object" && cause !== null && "code" in cause && cause.code === NOT_FOUND;

	}

}
