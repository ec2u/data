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

import preact from "@preact/preset-vite";
import { defaultClientConditions, defineConfig } from "vite";


export default defineConfig({ // https://vite.dev/config/

	root: "src",

	plugins: [preact()],

	resolve: {
		dedupe: ["preact"], // share one preact instance with linked @metreeca packages
		conditions: ["@ec2u/source", ...defaultClientConditions] // bundle workspace packages from their sources
	},

	build: {
		outDir: "../lib",
		assetsDir: ".",
		emptyOutDir: true
	},

	server: {
		proxy: {
			"^(/[-a-zA-Z0-9]+)+/?(\\?.*)?$": { // data routes, with optional query
				target: "http://localhost:8080/",
				xfwd: true
			}
		}
	}

});
