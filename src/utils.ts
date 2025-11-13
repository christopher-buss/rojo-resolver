import path from "node:path";

import { LUA_EXT, LUAU_EXT } from "./extensions";

export function arrayStartsWith<T>(a: ReadonlyArray<T>, b: ReadonlyArray<T>): boolean {
	const minLength = Math.min(a.length, b.length);
	for (let index = 0; index < minLength; index++) {
		if (a[index] !== b[index]) {
			return false;
		}
	}

	return true;
}

export function convertToLuau(filePath: string): string {
	const extension = path.extname(filePath);
	if (extension === LUA_EXT) {
		return filePath.slice(0, -extension.length) + LUAU_EXT;
	}

	return filePath;
}

export function isPathDescendantOf(filePath: string, directoryPath: string): boolean {
	return directoryPath === filePath || !path.relative(directoryPath, filePath).startsWith("..");
}
