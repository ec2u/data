/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

import {resolve} from "path";
import {readdirSync} from "fs";
import {defineConfig} from "vite";

import reactRefresh from "@vitejs/plugin-react-refresh";
import postcssNesting from "postcss-nesting";

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const base=process.env.base || ".";

const code=resolve(process.env.code || "src/main/scripts/");
const dist=resolve(process.env.dist || "target/scripts/");


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export default defineConfig(({ command, mode }) => ({ // https://vitejs.dev/config/

	root: code,
	base: base.replace(/^([^./])|([^/])$/g, "$2/$1"), // add leading/trailing slashes

	publicDir: "files",

	plugins: [reactRefresh()],

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

	resolve: mode === "production" ? {} : {
		alias: readdirSync(".")
			.filter(file => file === "aliases.json")
			.map(file => require(resolve(file)))
			.flatMap(aliases => Object.entries(aliases).map(([pack, path]) => ({
				find: new RegExp(`^${pack}/(.*)$`), replacement: `${path}/$1`
			})))
	},

	server: {
		proxy: { "^(?!$|/[_@]|.*\\.\\w+(\\?.*)?$).*$": { target: "http://localhost:8080/" } } // no empty/vite/file URLs
	}

}));
