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

import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({

	resolve: {

		alias: { // the runtime resolves the `@/` prefix from the tsconfig paths, which the test runner doesn't read

			"@/": `${fileURLToPath(new URL("src", import.meta.url))}/`

		}

	},

	test: {

		typecheck: {

			enabled: true,
			ignoreSourceErrors: true,

			tsconfig: "tsconfig.test.json" // the build config leaves test modules out, so type tests go unchecked under it

		}

	}

});
