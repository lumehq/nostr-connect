#!/usr/bin/env node
import esbuild from "esbuild";
import copy from "esbuild-copy-plugin";

const isProd = process.argv.indexOf("prod") !== -1;
const isFirefox = process.argv.indexOf("firefox") !== -1;

esbuild
	.build({
		bundle: true,
		entryPoints: {
			"popup.build": "./extension/popup.tsx",
			"prompt.build": "./extension/prompt.tsx",
			"options.build": "./extension/options.jsx",
			"background.build": "./extension/background.js",
			"content-script.build": "./extension/content-script.js",
		},
		outdir: "./extension/output",
		sourcemap: isProd ? false : "inline",
		define: {
			window: "self",
			global: "self",
		},
		plugins: [
			copy({
				assets: [
					{
						from: [
							isFirefox
								? "./extension/firefox/manifest.json"
								: "./extension/chrome/manifest.json",
						],
						to: ["./"],
					},
					{
						from: ["./extension/*.html"],
						to: ["./"],
					},
					{
						from: ["./extension/common.js"],
						to: ["./"],
					},
					{
						from: ["./extension/nostr-provider.js"],
						to: ["./"],
					},
					{
						from: ["./extension/icons/*"],
						to: ["./icons"],
					},
				],
			}),
		],
	})
	.then(() => console.log("Build success."))
	.catch((err) => console.error("Build error.", err));
