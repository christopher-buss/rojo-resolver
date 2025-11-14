/* eslint-disable sonar/no-duplicate-string -- Lots of strings. */
import { describe, expect, it } from "vitest";

import {
	gameRojoConfig,
	isolatedContainersConfig,
	multiPartitionConfig,
	networkTypeConfig,
} from "./__tests__/helpers/test-fixtures.js";
import { RbxType } from "./extensions.js";
import { FileRelation, NetworkType, RbxPathParent, RojoResolver } from "./rojo-resolver.js";
import type { RojoTree } from "./types.js";

// Helper to create tree objects with proper typing
function tree(object: any): RojoTree {
	return object as RojoTree;
}

describe("rojoResolver", () => {
	describe("fromTree", () => {
		it("should create a resolver from a simple tree", () => {
			const resolver = RojoResolver.fromTree(
				"/project",
				tree({
					$path: "src",
				}),
			);

			expect(resolver).toBeInstanceOf(RojoResolver);
			expect(resolver.getPartitions()).toHaveLength(1);
		});

		it("should create a resolver from a game tree", () => {
			const resolver = RojoResolver.fromTree("/project", tree(gameRojoConfig.tree));

			expect(resolver).toBeInstanceOf(RojoResolver);
			expect(resolver.isGame).toBe(true);
			expect(resolver.getPartitions().length).toBeGreaterThan(0);
		});

		it("should create partitions for each $path in the tree", () => {
			const resolver = RojoResolver.fromTree("/project", tree(multiPartitionConfig.tree));

			const partitions = resolver.getPartitions();
			expect(partitions.length).toBeGreaterThanOrEqual(3);
		});
	});

	describe("getRbxPathFromFilePath", () => {
		it("should map a file path to its Roblox path", () => {
			const resolver = RojoResolver.fromTree(
				"/project",
				tree({
					$path: "src",
				}),
			);

			const rbxPath = resolver.getRbxPathFromFilePath("/project/src/module.luau");
			expect(rbxPath).toEqual(["module"]);
		});

		it("should handle nested file paths", () => {
			const resolver = RojoResolver.fromTree(
				"/project",
				tree({
					$path: "src",
				}),
			);

			const rbxPath = resolver.getRbxPathFromFilePath("/project/src/utils/helper.luau");
			expect(rbxPath).toEqual(["utils", "helper"]);
		});

		it("should strip init from path for script files", () => {
			const resolver = RojoResolver.fromTree(
				"/project",
				tree({
					$path: "src",
				}),
			);

			const rbxPath = resolver.getRbxPathFromFilePath("/project/src/folder/init.luau");
			expect(rbxPath).toEqual(["folder"]);
		});

		it("should handle server script extensions", () => {
			const resolver = RojoResolver.fromTree(
				"/project",
				tree({
					$path: "src",
				}),
			);

			const rbxPath = resolver.getRbxPathFromFilePath("/project/src/script.server.luau");
			expect(rbxPath).toEqual(["script"]);
		});

		it("should handle client script extensions", () => {
			const resolver = RojoResolver.fromTree(
				"/project",
				tree({
					$path: "src",
				}),
			);

			const rbxPath = resolver.getRbxPathFromFilePath("/project/src/ui.client.luau");
			expect(rbxPath).toEqual(["ui"]);
		});

		it("should convert .lua files to .luau before resolving", () => {
			const resolver = RojoResolver.fromTree(
				"/project",
				tree({
					$path: "src",
				}),
			);

			const rbxPath = resolver.getRbxPathFromFilePath("/project/src/module.lua");
			expect(rbxPath).toEqual(["module"]);
		});

		it("should return undefined for files outside partitions", () => {
			const resolver = RojoResolver.fromTree(
				"/project",
				tree({
					$path: "src",
				}),
			);

			const rbxPath = resolver.getRbxPathFromFilePath("/other/file.luau");
			expect(rbxPath).toBeUndefined();
		});

		it("should handle game project paths correctly", () => {
			const resolver = RojoResolver.fromTree("/project", tree(gameRojoConfig.tree));

			const rbxPath = resolver.getRbxPathFromFilePath("/project/src/shared/module.luau");
			expect(rbxPath).toBeDefined();
			expect(rbxPath).toContain("ReplicatedStorage");
		});
	});

	describe("getRbxTypeFromFilePath", () => {
		it("should identify module scripts", () => {
			const resolver = RojoResolver.fromTree("/project", tree({ $path: "src" }));

			const type = resolver.getRbxTypeFromFilePath("/project/src/module.luau");
			expect(type).toBe(RbxType.ModuleScript);
		});

		it("should identify server scripts", () => {
			const resolver = RojoResolver.fromTree("/project", tree({ $path: "src" }));

			const type = resolver.getRbxTypeFromFilePath("/project/src/script.server.luau");
			expect(type).toBe(RbxType.Script);
		});

		it("should identify client scripts (LocalScript)", () => {
			const resolver = RojoResolver.fromTree("/project", tree({ $path: "src" }));

			const type = resolver.getRbxTypeFromFilePath("/project/src/ui.client.luau");
			expect(type).toBe(RbxType.LocalScript);
		});

		it("should treat JSON modules as ModuleScript", () => {
			const resolver = RojoResolver.fromTree("/project", tree({ $path: "src" }));

			const type = resolver.getRbxTypeFromFilePath("/project/src/data.json");
			expect(type).toBe(RbxType.ModuleScript);
		});

		it("should treat TOML modules as ModuleScript", () => {
			const resolver = RojoResolver.fromTree("/project", tree({ $path: "src" }));

			const type = resolver.getRbxTypeFromFilePath("/project/src/config.toml");
			expect(type).toBe(RbxType.ModuleScript);
		});

		it("should convert .lua to .luau before determining type", () => {
			const resolver = RojoResolver.fromTree("/project", tree({ $path: "src" }));

			const type = resolver.getRbxTypeFromFilePath("/project/src/script.server.lua");
			expect(type).toBe(RbxType.Script);
		});
	});

	describe("getNetworkType", () => {
		it("should return Unknown for non-game projects", () => {
			const resolver = RojoResolver.fromTree("/project", tree({ $path: "src" }));

			const anyPath = ["Module"];
			expect(resolver.getNetworkType(anyPath)).toBe(NetworkType.Unknown);
		});

		it("should return Server for ServerScriptService paths", () => {
			const resolver = RojoResolver.fromTree("/project", tree(networkTypeConfig.tree));

			const serverPath = ["ServerScriptService", "Module"];
			expect(resolver.getNetworkType(serverPath)).toBe(NetworkType.Server);
		});

		it("should return Server for ServerStorage paths", () => {
			const resolver = RojoResolver.fromTree("/project", tree(networkTypeConfig.tree));

			const serverPath = ["ServerStorage", "Data"];
			expect(resolver.getNetworkType(serverPath)).toBe(NetworkType.Server);
		});

		it("should return Client for StarterPlayer paths", () => {
			const resolver = RojoResolver.fromTree("/project", tree(networkTypeConfig.tree));

			const clientPath = ["StarterPlayer", "StarterPlayerScripts", "UI"];
			expect(resolver.getNetworkType(clientPath)).toBe(NetworkType.Client);
		});

		it("should return Client for StarterGui paths", () => {
			const resolver = RojoResolver.fromTree("/project", tree(isolatedContainersConfig.tree));

			const clientPath = ["StarterGui", "Menu"];
			expect(resolver.getNetworkType(clientPath)).toBe(NetworkType.Client);
		});

		it("should return Client for StarterPack paths", () => {
			const resolver = RojoResolver.fromTree("/project", tree(isolatedContainersConfig.tree));

			const clientPath = ["StarterPack", "Tool"];
			expect(resolver.getNetworkType(clientPath)).toBe(NetworkType.Client);
		});

		it("should return Unknown for ReplicatedStorage paths in game projects", () => {
			const resolver = RojoResolver.fromTree("/project", tree(gameRojoConfig.tree));

			const sharedPath = ["game", "ReplicatedStorage", "Shared", "Module"];
			expect(resolver.getNetworkType(sharedPath)).toBe(NetworkType.Unknown);
		});

		it("should return Unknown for paths not in server or client containers", () => {
			const resolver = RojoResolver.fromTree(
				"/project",
				tree({
					$className: "DataModel",
					Workspace: {
						$className: "Workspace",
						$path: "src/workspace",
					},
				}),
			);

			const workspacePath = ["game", "Workspace", "Model"];
			expect(resolver.getNetworkType(workspacePath)).toBe(NetworkType.Unknown);
		});
	});

	describe("getFileRelation", () => {
		it("should return OutToOut for files both outside isolated containers", () => {
			const resolver = RojoResolver.fromTree(
				"/project",
				tree({
					$className: "DataModel",
					ReplicatedStorage: {
						$className: "ReplicatedStorage",
						$path: "src/shared",
					},
				}),
			);

			const file1 = ["game", "ReplicatedStorage", "Module1"];
			const file2 = ["game", "ReplicatedStorage", "Module2"];
			expect(resolver.getFileRelation(file1, file2)).toBe(FileRelation.OutToOut);
		});

		it("should return InToIn for files in the same isolated container", () => {
			const resolver = RojoResolver.fromTree("/project", tree(isolatedContainersConfig.tree));

			const file1 = ["StarterGui", "Menu"];
			const file2 = ["StarterGui", "Button"];
			expect(resolver.getFileRelation(file1, file2)).toBe(FileRelation.InToIn);
		});

		it("should return InToIn for nested paths in same isolated container", () => {
			const resolver = RojoResolver.fromTree("/project", tree(isolatedContainersConfig.tree));

			const file1 = ["StarterGui", "Menus", "Main"];
			const file2 = ["StarterGui", "Buttons", "Primary"];
			expect(resolver.getFileRelation(file1, file2)).toBe(FileRelation.InToIn);
		});

		it("should return OutToIn for files in different isolated containers", () => {
			const resolver = RojoResolver.fromTree("/project", tree(isolatedContainersConfig.tree));

			const file1 = ["StarterGui", "Menu"];
			const file2 = ["StarterPack", "Tool"];
			// Both are isolated but different containers
			expect(resolver.getFileRelation(file1, file2)).toBe(FileRelation.OutToIn);
		});

		it("should return InToOut for file in isolated container, module outside", () => {
			const resolver = RojoResolver.fromTree(
				"/project",
				tree({
					$className: "DataModel",
					ReplicatedStorage: {
						$className: "ReplicatedStorage",
						$path: "src/shared",
					},
					StarterGui: {
						$className: "StarterGui",
						$path: "src/gui",
					},
				}),
			);

			const file = ["StarterGui", "Menu"];
			const module = ["ReplicatedStorage", "Utils"];
			expect(resolver.getFileRelation(file, module)).toBe(FileRelation.InToOut);
		});

		it("should return OutToIn for file outside, module in isolated container", () => {
			const resolver = RojoResolver.fromTree(
				"/project",
				tree({
					$className: "DataModel",
					ReplicatedStorage: {
						$className: "ReplicatedStorage",
						$path: "src/shared",
					},
					StarterGui: {
						$className: "StarterGui",
						$path: "src/gui",
					},
				}),
			);

			const file = ["ReplicatedStorage", "Utils"];
			const module = ["StarterGui", "Menu"];
			expect(resolver.getFileRelation(file, module)).toBe(FileRelation.OutToIn);
		});

		it("should return InToIn for StarterPlayerScripts paths in same container", () => {
			const resolver = RojoResolver.fromTree("/project", tree(networkTypeConfig.tree));

			const file1 = ["StarterPlayer", "StarterPlayerScripts", "UI"];
			const file2 = ["StarterPlayer", "StarterPlayerScripts", "Controls"];
			expect(resolver.getFileRelation(file1, file2)).toBe(FileRelation.InToIn);
		});
	});

	describe("isIsolated", () => {
		it("should return false for paths outside isolated containers", () => {
			const resolver = RojoResolver.fromTree(
				"/project",
				tree({
					$className: "DataModel",
					ReplicatedStorage: {
						$className: "ReplicatedStorage",
						$path: "src/shared",
					},
				}),
			);

			const replicatedStoragePath = ["game", "ReplicatedStorage", "Module"];
			expect(resolver.isIsolated(replicatedStoragePath)).toBe(false);
		});

		it("should return false for non-game projects", () => {
			const resolver = RojoResolver.fromTree("/project", tree({ $path: "src" }));

			const anyPath = ["Module"];
			expect(resolver.isIsolated(anyPath)).toBe(false);
		});

		it("should return true for paths in StarterGui", () => {
			const resolver = RojoResolver.fromTree("/project", tree(isolatedContainersConfig.tree));

			const guiPath = ["StarterGui", "Menu"];
			expect(resolver.isIsolated(guiPath)).toBe(true);
		});

		it("should return true for paths in StarterPack", () => {
			const resolver = RojoResolver.fromTree("/project", tree(isolatedContainersConfig.tree));

			const packPath = ["StarterPack", "Tool"];
			expect(resolver.isIsolated(packPath)).toBe(true);
		});

		it("should return true for nested paths in StarterPlayerScripts", () => {
			const resolver = RojoResolver.fromTree("/project", tree(networkTypeConfig.tree));

			const scriptPath = ["StarterPlayer", "StarterPlayerScripts", "UI", "Menu"];
			expect(resolver.isIsolated(scriptPath)).toBe(true);
		});

		it("should return true for paths in StarterCharacterScripts", () => {
			const resolver = RojoResolver.fromTree(
				"/project",
				tree({
					$className: "DataModel",
					StarterPlayer: {
						$className: "StarterPlayer",
						StarterCharacterScripts: {
							$className: "StarterCharacterScripts",
							$path: "src/character",
						},
					},
				}),
			);

			const charPath = ["StarterPlayer", "StarterCharacterScripts", "Animate"];
			expect(resolver.isIsolated(charPath)).toBe(true);
		});

		it("should return true for paths in PluginDebugService", () => {
			const resolver = RojoResolver.fromTree(
				"/project",
				tree({
					$className: "DataModel",
					PluginDebugService: {
						$className: "PluginDebugService",
						$path: "src/plugin",
					},
				}),
			);

			const pluginPath = ["PluginDebugService", "DebugTool"];
			expect(resolver.isIsolated(pluginPath)).toBe(true);
		});

		it("should return false for paths in StarterPlayer but not in isolated child containers", () => {
			const resolver = RojoResolver.fromTree(
				"/project",
				tree({
					$className: "DataModel",
					StarterPlayer: {
						$className: "StarterPlayer",
						$path: "src/player",
					},
				}),
			);

			// StarterPlayer itself is not isolated, only specific children
			const playerPath = ["StarterPlayer", "Module"];
			expect(resolver.isIsolated(playerPath)).toBe(false);
		});

		it("should return false for ServerScriptService (not isolated)", () => {
			const resolver = RojoResolver.fromTree("/project", tree(networkTypeConfig.tree));

			const serverPath = ["ServerScriptService", "Handler"];
			expect(resolver.isIsolated(serverPath)).toBe(false);
		});
	});

	describe("relative", () => {
		it("should calculate relative path for sibling modules", () => {
			const from = ["game", "ReplicatedStorage", "Module1"];
			const to = ["game", "ReplicatedStorage", "Module2"];

			const result = RojoResolver.relative(from, to);

			expect(result).toEqual([RbxPathParent, "Module2"]);
		});

		it("should calculate relative path from parent to child", () => {
			const from = ["game", "ReplicatedStorage"];
			const to = ["game", "ReplicatedStorage", "Folder", "Module"];

			const result = RojoResolver.relative(from, to);

			expect(result).toEqual(["Folder", "Module"]);
		});

		it("should calculate relative path from child to parent", () => {
			const from = ["game", "ReplicatedStorage", "Folder", "Module"];
			const to = ["game", "ReplicatedStorage"];

			const result = RojoResolver.relative(from, to);

			expect(result).toEqual([RbxPathParent, RbxPathParent]);
		});

		it("should calculate relative path between different branches", () => {
			const from = ["game", "ReplicatedStorage", "Module"];
			const to = ["game", "ServerStorage", "Data"];

			const result = RojoResolver.relative(from, to);

			expect(result).toEqual([RbxPathParent, RbxPathParent, "ServerStorage", "Data"]);
		});

		it("should return empty array for identical paths", () => {
			const from = ["game", "ReplicatedStorage", "Module"];
			const to = ["game", "ReplicatedStorage", "Module"];

			const result = RojoResolver.relative(from, to);

			// For identical paths, the relative path is empty (no navigation
			// needed)
			expect(result).toEqual([]);
		});

		it("should handle paths from root", () => {
			const from = ["game"];
			const to = ["game", "ReplicatedStorage", "Module"];

			const result = RojoResolver.relative(from, to);

			expect(result).toEqual(["ReplicatedStorage", "Module"]);
		});
	});

	describe("getPartitions", () => {
		it("should return partition information", () => {
			const resolver = RojoResolver.fromTree("/project", tree(multiPartitionConfig.tree));

			const partitions = resolver.getPartitions();

			expect(partitions.length).toBeGreaterThan(0);
			for (const partition of partitions) {
				expect(partition).toHaveProperty("fsPath");
				expect(partition).toHaveProperty("rbxPath");
				expect(typeof partition.fsPath).toBe("string");
				expect(Array.isArray(partition.rbxPath)).toBe(true);
			}
		});

		it("should return readonly array", () => {
			const resolver = RojoResolver.fromTree("/project", tree({ $path: "src" }));

			const partitions = resolver.getPartitions();

			// TypeScript compile-time check ensures readonly
			expect(Array.isArray(partitions)).toBe(true);
		});
	});

	describe("getWarnings", () => {
		it("should return empty array when no warnings", () => {
			const resolver = RojoResolver.fromTree("/project", tree({ $path: "src" }));

			const warnings = resolver.getWarnings();

			expect(warnings).toEqual([]);
		});

		it("should return readonly array", () => {
			const resolver = RojoResolver.fromTree("/project", tree({ $path: "src" }));

			const warnings = resolver.getWarnings();

			// TypeScript compile-time check ensures readonly
			expect(Array.isArray(warnings)).toBe(true);
		});
	});

	describe("synthetic", () => {
		it("should create a synthetic resolver for packages", () => {
			const resolver = RojoResolver.synthetic("/package");

			expect(resolver).toBeInstanceOf(RojoResolver);
			expect(resolver.isGame).toBe(false);
		});

		it("should create a partition at the base path", () => {
			const resolver = RojoResolver.synthetic("/package");

			const partitions = resolver.getPartitions();
			expect(partitions).toHaveLength(1);
			expect(partitions[0]?.fsPath).toContain("package");
		});
	});
});
