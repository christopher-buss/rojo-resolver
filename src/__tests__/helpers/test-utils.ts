import { expect } from "vitest";

import type { RbxPath } from "../../types.js";

/** Creates an RbxPath from string segments */
export function createRbxPath(...segments: Array<string>): RbxPath {
	return segments as RbxPath;
}

/** Assert that two RbxPaths are equal */
export function expectRbxPathEqual(actual: RbxPath, expected: RbxPath): void {
	expect(actual).toEqual(expected);
	expect(actual.length).toBe(expected.length);

	for (const [index, element] of actual.entries()) {
		expect(element).toBe(expected[index]);
	}
}

/** Creates a mock file path for testing */
export function mockFilePath(...segments: Array<string>): string {
	return segments.join("/");
}

/** Normalizes path separators for cross-platform testing */
export function normalizePath(path: string): string {
	return path.replace(/\\/g, "/");
}
