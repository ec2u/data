/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

import {resolve} from "path";

import HtmlWebpackPlugin from "html-webpack-plugin";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const code=process.env.code || "src/main/scripts/";
const dist=process.env.dist || "target/scripts/";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export default {

	cache: true,

	entry: {
		index: resolve(code, "index.tsx")
	},

	resolve: {
		extensions: [".tsx", ".ts", ".js", ".json"]
	},

	module: {
		rules: [
			{
				test: /\.jsx?$/, resolve: { fullySpecified: false }
			},
			{
				test: /\.tsx?$/, use: [
					{ loader: "ts-loader", options: { compilerOptions: { outDir: resolve(dist) } } }
				]
			},
			{
				test: /\.less$/, use: [
					"style-loader",
					"css-loader",
					"less-loader"
				]
			}
		]
	},

	plugins: [
		new HtmlWebpackPlugin({
			base: { href: "/", target: "_blank" },
			template: resolve(code, "index.html"),
			favicon: resolve(code, "index.svg")
		})
	],

	output: {
		path: resolve(dist),
		filename: "[name].js"
	},

	devtool: "nosources-source-map",

	devServer: { // https://webpack.js.org/configuration/dev-server/

		index: "", // specify to enable root proxying
		contentBase: resolve(dist),
		publicPath: "/",

		liveReload: true,

		port: 6800,
		https: false,
		compress: true,

		open: "Google Chrome",
		openPage: "",

		overlay: {
			warnings: true,
			errors: true
		},

		proxy: {
			context: () => true, // root proxying
			target: "http://localhost:8080/",
			changeOrigin: true // required by GAE virtual host
		}

	}

};
