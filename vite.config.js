/*
 * Copyright © 2020-2021 Metreeca srl
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

import {resolve} from "path";
import {defineConfig} from "vite";

import preact from "@preact/preset-vite";
import postcssNesting from "postcss-nesting";

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const code=resolve(process.env.code || "src/main/scripts/");
const dist=resolve(process.env.dist || "target/scripts/");


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export default defineConfig({ // https://vitejs.dev/config/

	root: code,

	plugins: [preact()],

	css: {
		postcss: {
			plugins: [postcssNesting()]
		}
	},

	build: {

		outDir: dist,
		assetsDir: ".",
		emptyOutDir: true,

		rollupOptions: {
			output: { manualChunks: undefined }
		}

	},

	server: {
		port: 6800,
		open: "/index.html", // open static asset
		proxy: { "^(/[-\\w]*)+(\\?.*)?$": { target: "http://localhost:8080/" } } // proxy routes+queries
	}

});
