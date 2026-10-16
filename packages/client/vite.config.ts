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

import { symlinks } from "@metreeca/rack/vite";
import preact from "@preact/preset-vite";
import { defineConfig } from "vite";


export default defineConfig({ // https://vite.dev/config/

	root: "src",

	plugins: [
		symlinks({ conditions: ["@ec2u/source", "@metreeca/source"] }), // bundle linked packages from their sources
		preact()
	],

	build: {
		outDir: "../../server/lib/static", // deployed with the server
		assetsDir: ".",
		emptyOutDir: true
	},

	server: {
		proxy: {
			"^(/[-a-zA-Z0-9]+)*/?(\\?.*)?$": { // data routes, with optional query
				target: "http://localhost:8080/",
				xfwd: true,
				bypass: request => request.headers.accept?.includes("text/html")
					? "/index.html"
					: undefined
			}
		}
	}

});
