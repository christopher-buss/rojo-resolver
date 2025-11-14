/* eslint-disable sonar/no-duplicate-string -- Lots of strings. */
import { describe, expect, it } from "vitest";

import { arrayStartsWith, convertToLuau, isPathDescendantOf } from "./utils.js";

describe("arrayStartsWith", () => {
	it("should return true when array a starts with all elements of b", () => {
		expect(arrayStartsWith([1, 2, 3, 4], [1, 2])).toBe(true);
		expect(arrayStartsWith(["a", "b", "c"], ["a", "b", "c"])).toBe(true);
		expect(arrayStartsWith(["game", "ReplicatedStorage", "Module"], ["game"])).toBe(true);
	});

	it("should return false when arrays do not match", () => {
		expect(arrayStartsWith([1, 2, 3], [1, 3])).toBe(false);
		expect(arrayStartsWith(["a", "b"], ["c", "d"])).toBe(false);
		expect(arrayStartsWith(["game", "Workspace"], ["game", "ReplicatedStorage"])).toBe(false);
	});

	it("should return true for identical arrays", () => {
		expect(arrayStartsWith([1, 2, 3], [1, 2, 3])).toBe(true);
		expect(arrayStartsWith([], [])).toBe(true);
	});

	it("should return true when b is empty", () => {
		expect(arrayStartsWith([1, 2, 3], [])).toBe(true);
		expect(arrayStartsWith([], [])).toBe(true);
	});

	it("should return true when a is longer than b and starts with b", () => {
		expect(arrayStartsWith([1, 2, 3, 4, 5], [1, 2, 3])).toBe(true);
	});

	it("should return true when b is longer than a and a matches the start of b", () => {
		// arrayStartsWith checks if the first min(a.length, b.length) elements
		// match This allows checking if shorter arrays are prefixes of longer
		// arrays
		expect(arrayStartsWith([1, 2], [1, 2, 3, 4])).toBe(true);
	});
});

describe("convertToLuau", () => {
	it("should convert .lua files to .luau", () => {
		expect(convertToLuau("module.lua")).toBe("module.luau");
		expect(convertToLuau("path/to/file.lua")).toBe("path/to/file.luau");
		expect(convertToLuau("/absolute/path/script.lua")).toBe("/absolute/path/script.luau");
	});

	it("should leave .luau files unchanged", () => {
		expect(convertToLuau("module.luau")).toBe("module.luau");
		expect(convertToLuau("path/to/file.luau")).toBe("path/to/file.luau");
	});

	it("should leave files with other extensions unchanged", () => {
		expect(convertToLuau("data.json")).toBe("data.json");
		expect(convertToLuau("config.toml")).toBe("config.toml");
		expect(convertToLuau("readme.md")).toBe("readme.md");
		expect(convertToLuau("file")).toBe("file");
	});

	it("should handle files with sub-extensions correctly", () => {
		expect(convertToLuau("script.server.lua")).toBe("script.server.luau");
		expect(convertToLuau("script.client.lua")).toBe("script.client.luau");
	});
});

describe("isPathDescendantOf", () => {
	it("should return true when filePath is a direct child of directoryPath", () => {
		expect(isPathDescendantOf("parent/child", "parent")).toBe(true);
		expect(isPathDescendantOf("/root/subdir/file.txt", "/root/subdir")).toBe(true);
	});

	it("should return true when filePath is a nested descendant", () => {
		expect(isPathDescendantOf("parent/child/grandchild", "parent")).toBe(true);
		expect(isPathDescendantOf("/root/a/b/c/d", "/root/a")).toBe(true);
	});

	it("should return true when paths are identical", () => {
		expect(isPathDescendantOf("path/to/dir", "path/to/dir")).toBe(true);
		expect(isPathDescendantOf("/absolute/path", "/absolute/path")).toBe(true);
	});

	it("should return false when filePath is not a descendant", () => {
		expect(isPathDescendantOf("other/path", "parent")).toBe(false);
		expect(isPathDescendantOf("/root/other", "/root/different")).toBe(false);
	});

	it("should return false when filePath is a parent of directoryPath", () => {
		expect(isPathDescendantOf("parent", "parent/child")).toBe(false);
		expect(isPathDescendantOf("/root", "/root/subdir/deep")).toBe(false);
	});

	it("should return false when paths are siblings", () => {
		expect(isPathDescendantOf("parent/child1", "parent/child2")).toBe(false);
	});
});
