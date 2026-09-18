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

import { defineConfig } from "vitest/config";

export default defineConfig({

	resolve: {

		conditions: [ // resolve packages to their sources, so a test run doesn't depend on a prior build

			"@ec2u/source",
			"node",
			"module",
			"development"

		]

	},

	test: {

		typecheck: {

			enabled: true,
			ignoreSourceErrors: true,

			tsconfig: "tsconfig.json" // the build config leaves test modules out, so type tests go unchecked under it

		}

	}

});
