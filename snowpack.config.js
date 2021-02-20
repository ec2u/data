/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

const proxy=require("http-proxy").createServer({ target: "http://localhost:8080/" });

module.exports={

	mount: {
		"src/main/javascript": "/"
	},

	routes: [
		{ match: "routes", src: "/.*", dest: (req, res) => proxy.web(req, res) }
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
