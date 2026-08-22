/*
 * Copyright © 2020-2026 EC2U Alliance
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

import { error } from "@metreeca/core";
import { AsyncLocalStorage } from "node:async_hooks";


export type Service<T> = {

	(): T;

	readonly with: (value: T) => Binding;

}

export type Binding = (scope: Scope) => void;

export type Scope = {

	readonly parent: Scope | undefined;

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const scopes = new AsyncLocalStorage<Scope>();

const root: Scope = { parent: undefined };


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function service<T>(factory: () => T): Service<T> {

	const values = new WeakMap<Scope, { readonly value: T }>();

	const lookup = (scope: Scope | undefined): { readonly value: T } | undefined => (
		scope ? values.get(scope) ?? lookup(scope.parent) : undefined
	);

	const resolve = (): T => {

		const cached = lookup(scopes.getStore() ?? root);

		if ( cached ) {

			return cached.value;

		} else {

			const value = factory();

			values.set(root, { value }); // defaults are memoized process-wide

			return value;

		}

	};

	return Object.assign(resolve, {

		with: (value: T): Binding => scope => {
			values.set(scope, { value }); // bindings are installed into the target scope
		}

	});

}

export function using<V>(bindings: readonly Binding[], task: () => V): V {

	const scope: Scope = { parent: scopes.getStore() ?? root };

	bindings.forEach(binding => binding(scope)); // binding installation is effectful by nature

	return scopes.run(scope, task);

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// @/_/vault.ts ‒ abstraction; no implementation imports

export type Vault = {

	readonly read: (key: string) => Promise<string>;

}

export const vault = service<Vault>(() => error("undefined vault service"));

export function secret(key: string): Promise<string> {
	return vault().read(key);
}


// @/_/vaults.ts ‒ implementations; imported by entry points only

export function mapVault(entries: Readonly<Record<string, string>>): Vault {

	return {

		read: async key => entries[key] ?? error(`undefined secret <${key}>`)

	};

}

export function envVault(prefix: string = ""): Vault {

	return {

		read: async key => process.env[`${prefix}${key}`] ?? error(`undefined secret <${key}>`)

	};

}


// @/taxonomies/feeds/isced-2011.ts ‒ consumer; unaware of the implementation

export async function sync(): Promise<string> {
	return secret("taxonomies-ec2u-isced-2011");
}

export function main(): Promise<string> {
	return using([vault.with(envVault("EC2U_"))], sync);
}
