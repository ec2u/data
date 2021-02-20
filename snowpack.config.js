/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

/** @type {import("snowpack").SnowpackUserConfig } */

module.exports={

	mount: {
		"src/main/javascript": "/"
	},

	routes: [
		{match: "routes", src: ".*", dest: "/index.html"}
	],

	plugins: [
		"snowpack-plugin-less"
	],

	optimize: {
		bundle: true,
		minify: true,
		splitting: true,
		treeshake: true,
		manifest: false,
		target: "es2020"
	},

	devOptions: {
		port: 6800
	},

	buildOptions: {
		out: "target/bundle"
	}

};
