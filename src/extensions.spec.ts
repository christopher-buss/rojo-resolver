import { describe, expect, it } from "vitest";

import { stripRojoExtensions } from "./extensions.js";

describe("stripRojoExtensions", () => {
	describe("basic script extensions", () => {
		it("should strip .luau extension from module files", () => {
			expect(stripRojoExtensions("module.luau")).toBe("module");
			expect(stripRojoExtensions("path/to/module.luau")).toBe("path/to/module");
		});

		it("should strip .server.luau extension from server scripts", () => {
			expect(stripRojoExtensions("script.server.luau")).toBe("script");
			expect(stripRojoExtensions("path/to/handler.server.luau")).toBe("path/to/handler");
		});

		it("should strip .client.luau extension from local scripts", () => {
			expect(stripRojoExtensions("ui.client.luau")).toBe("ui");
			expect(stripRojoExtensions("path/to/controller.client.luau")).toBe(
				"path/to/controller",
			);
		});
	});

	describe("data module extensions", () => {
		it("should strip .json extension", () => {
			expect(stripRojoExtensions("data.json")).toBe("data");
			expect(stripRojoExtensions("config/settings.json")).toBe("config/settings");
		});

		it("should strip .toml extension", () => {
			expect(stripRojoExtensions("config.toml")).toBe("config");
			expect(stripRojoExtensions("settings/app.toml")).toBe("settings/app");
		});
	});

	describe("edge cases", () => {
		it("should handle files with multiple dots", () => {
			expect(stripRojoExtensions("my.file.name.luau")).toBe("my.file.name");
			expect(stripRojoExtensions("file.with.dots.server.luau")).toBe("file.with.dots");
		});

		it("should leave non-Rojo extensions unchanged", () => {
			expect(stripRojoExtensions("readme.md")).toBe("readme.md");
			expect(stripRojoExtensions("script.txt")).toBe("script.txt");
			expect(stripRojoExtensions("file.lua")).toBe("file.lua");
		});

		it("should handle files without extensions", () => {
			expect(stripRojoExtensions("filename")).toBe("filename");
			expect(stripRojoExtensions("path/to/file")).toBe("path/to/file");
		});

		it("should handle init files correctly", () => {
			expect(stripRojoExtensions("init.luau")).toBe("init");
			expect(stripRojoExtensions("init.server.luau")).toBe("init");
			expect(stripRojoExtensions("init.client.luau")).toBe("init");
		});

		it("should handle absolute paths", () => {
			expect(stripRojoExtensions("/absolute/path/module.luau")).toBe("/absolute/path/module");
			expect(stripRojoExtensions("C:\\Windows\\path\\script.server.luau")).toBe(
				"C:\\Windows\\path\\script",
			);
		});

		it("should handle paths with spaces", () => {
			expect(stripRojoExtensions("my module.luau")).toBe("my module");
			expect(stripRojoExtensions("path with spaces/file.server.luau")).toBe(
				"path with spaces/file",
			);
		});
	});

	describe("incorrect extensions", () => {
		it("should not strip sub-extension without proper main extension", () => {
			expect(stripRojoExtensions("file.server")).toBe("file.server");
			expect(stripRojoExtensions("file.client.txt")).toBe("file.client.txt");
		});
	});
});
