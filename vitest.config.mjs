import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		// Coverage configuration
		coverage: {
			exclude: ["src/**/*.{spec,test}.ts", "src/**/*.d.ts", "src/index.ts"],
			include: ["src/**/*.ts"],
			provider: "v8",
			reporter: ["text", "html", "json"],
			reportsDirectory: "./coverage",
		},

		// Environment
		environment: "node",

		// Enable globals (describe, it, expect, etc.) without imports
		globals: true,

		// Test file patterns
		include: ["src/**/*.{spec,test}.{ts,tsx}"],
	},
});
