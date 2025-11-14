import { describe, expect, it } from "vitest";

import { isValidRojoConfig } from "./validation.js";

describe("isValidRojoConfig", () => {
	describe("valid configurations", () => {
		it("should validate a minimal config with name and tree", () => {
			const validConfig = {
				name: "TestProject",
				tree: {
					$path: "src",
				},
			};

			expect(isValidRojoConfig(validConfig)).toBe(true);
		});

		it("should validate a config with servePort", () => {
			const validConfig = {
				name: "TestProject",
				servePort: 34872,
				tree: {
					$path: "src",
				},
			};

			expect(isValidRojoConfig(validConfig)).toBe(true);
		});

		it("should validate a config with nested tree structure", () => {
			const validConfig = {
				name: "GameProject",
				tree: {
					$className: "DataModel",
					ReplicatedStorage: {
						$className: "ReplicatedStorage",
						$path: "src/shared",
					},
					ServerScriptService: {
						$className: "ServerScriptService",
						$path: "src/server",
					},
				},
			};

			expect(isValidRojoConfig(validConfig)).toBe(true);
		});

		it("should validate a config with $properties", () => {
			const validConfig = {
				name: "PropertiesTest",
				tree: {
					$className: "Folder",
					$properties: {
						AnotherAttribute: 123,
						AttributeName: "TestValue",
					},
				},
			};

			expect(isValidRojoConfig(validConfig)).toBe(true);
		});

		it("should validate a config with optional path", () => {
			const validConfig = {
				name: "OptionalPath",
				tree: {
					$path: {
						optional: "src/optional",
					},
				},
			};

			expect(isValidRojoConfig(validConfig)).toBe(true);
		});

		it("should validate a config with $ignoreUnknownInstances", () => {
			const validConfig = {
				name: "IgnoreTest",
				tree: {
					$className: "Folder",
					$ignoreUnknownInstances: true,
				},
			};

			expect(isValidRojoConfig(validConfig)).toBe(true);
		});

		it("should validate a complex nested config", () => {
			const validConfig = {
				name: "ComplexProject",
				servePort: 34872,
				tree: {
					$className: "DataModel",
					ReplicatedStorage: {
						$className: "ReplicatedStorage",
						Assets: {
							$className: "Folder",
							$ignoreUnknownInstances: true,
						},
						Modules: {
							$path: "src/shared",
						},
					},
					ServerScriptService: {
						$className: "ServerScriptService",
						Scripts: {
							$path: "src/server",
						},
					},
				},
			};

			expect(isValidRojoConfig(validConfig)).toBe(true);
		});
	});

	describe("invalid configurations", () => {
		it("should reject config without name", () => {
			const invalidConfig = {
				tree: {
					$path: "src",
				},
			};

			expect(isValidRojoConfig(invalidConfig)).toBe(false);
		});

		it("should reject config without tree", () => {
			const invalidConfig = {
				name: "NoTree",
			};

			expect(isValidRojoConfig(invalidConfig)).toBe(false);
		});

		it("should reject config with wrong type for name", () => {
			const invalidConfig = {
				name: 123,
				tree: {
					$path: "src",
				},
			};

			expect(isValidRojoConfig(invalidConfig)).toBe(false);
		});

		it("should reject null", () => {
			expect(isValidRojoConfig(null)).toBe(false);
		});

		it("should reject undefined", () => {
			expect(isValidRojoConfig(undefined)).toBe(false);
		});

		it("should reject non-object values", () => {
			expect(isValidRojoConfig("string")).toBe(false);
			expect(isValidRojoConfig(123)).toBe(false);
			expect(isValidRojoConfig(true)).toBe(false);
			expect(isValidRojoConfig([])).toBe(false);
		});

		it("should reject empty object", () => {
			expect(isValidRojoConfig({})).toBe(false);
		});

		it("should reject config with servePort as non-number", () => {
			const invalidConfig = {
				name: "InvalidPort",
				servePort: "not a number",
				tree: {
					$path: "src",
				},
			};

			expect(isValidRojoConfig(invalidConfig)).toBe(false);
		});
	});

	describe("edge cases", () => {
		it("should validate empty tree object", () => {
			const config = {
				name: "EmptyTree",
				tree: {},
			};

			expect(isValidRojoConfig(config)).toBe(true);
		});

		it("should validate deeply nested tree", () => {
			const config = {
				name: "DeepNesting",
				tree: {
					Level1: {
						Level2: {
							Level3: {
								Level4: {
									Level5: {
										$path: "very/deep/path",
									},
								},
							},
						},
					},
				},
			};

			expect(isValidRojoConfig(config)).toBe(true);
		});
	});
});
