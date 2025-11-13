import isentinel from "@isentinel/eslint-config";

export default isentinel({
	jsdoc: false,
	name: "tools/nx",
	roblox: false,
	test: {
		vitest: true,
	},
	type: "package",
	typescript: {
		outOfProjectFiles: [],
		overridesTypeAware: {
			"ts/no-unsafe-member-access": ["error", { allowOptionalChaining: true }],
		},
		tsconfigPath: "./tsconfig.json",
	},
});
