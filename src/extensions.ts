import path from "node:path";

export const LUA_EXT = ".lua";
export const LUAU_EXT = ".luau";
export const JSON_EXT = ".json";
export const TOML_EXT = ".toml";

export const SERVER_SUB_EXT = ".server";
export const CLIENT_SUB_EXT = ".client";
export const MODULE_SUB_EXT = "";

export const ROJO_MODULE_EXTS = new Set([JSON_EXT, LUAU_EXT, TOML_EXT]);
export const ROJO_SCRIPT_EXTS = new Set([LUAU_EXT]);

export enum RbxType {
	ModuleScript,
	Script,
	LocalScript,
	Unknown,
}

export const SUB_EXT_TYPE_MAP = new Map<string, RbxType>([
	[CLIENT_SUB_EXT, RbxType.LocalScript],
	[MODULE_SUB_EXT, RbxType.ModuleScript],
	[SERVER_SUB_EXT, RbxType.Script],
]);

export function stripRojoExtensions(filePath: string): string {
	const extension = path.extname(filePath);
	if (ROJO_MODULE_EXTS.has(extension)) {
		filePath = filePath.slice(0, -extension.length);
		if (ROJO_SCRIPT_EXTS.has(extension)) {
			const subExtension = path.extname(filePath);
			if (subExtension === SERVER_SUB_EXT || subExtension === CLIENT_SUB_EXT) {
				filePath = filePath.slice(0, -subExtension.length);
			}
		}
	}

	return filePath;
}
