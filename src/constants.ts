import path from "node:path";

import type { RbxPath } from "./types";

export const PACKAGE_ROOT = path.join(__dirname, "..");

export const INIT_NAME = "init";

export const ROJO_FILE_REGEX = /^.+\.project\.json$/;
export const ROJO_DEFAULT_NAME = "default.project.json";
export const ROJO_OLD_NAME = "roblox-project.json";

export const DEFAULT_ISOLATED_CONTAINERS: Array<RbxPath> = [
	["StarterPack"],
	["StarterGui"],
	["StarterPlayer", "StarterPlayerScripts"],
	["StarterPlayer", "StarterCharacterScripts"],
	["StarterPlayer", "StarterCharacter"],
	["PluginDebugService"],
];

export const CLIENT_CONTAINERS = [["StarterPack"], ["StarterGui"], ["StarterPlayer"]];
export const SERVER_CONTAINERS = [["ServerStorage"], ["ServerScriptService"]];

export const SCHEMA_PATH = path.join(PACKAGE_ROOT, "rojo-schema.json");
