/**
 * Test fixtures for rojo-resolver tests Contains mock Rojo configurations and
 * file trees
 */

import type { RojoTree } from "../../types.js";

/** Minimal valid Rojo configuration */
export const minimalRojoConfig = {
	name: "MinimalProject",
	tree: {
		$path: "src",
	},
};

/** Package-style Rojo configuration (non-game) */
export const packageRojoConfig = {
	name: "MyPackage",
	tree: {
		$path: "src",
	},
};

/** Full game project with DataModel */
export const gameRojoConfig = {
	name: "GameProject",
	tree: {
		$className: "DataModel",
		ReplicatedStorage: {
			$className: "ReplicatedStorage",
			Shared: {
				$path: "src/shared",
			},
		},
		ServerScriptService: {
			$className: "ServerScriptService",
			$path: "src/server",
		},
		StarterPlayer: {
			$className: "StarterPlayer",
			StarterPlayerScripts: {
				$className: "StarterPlayerScripts",
				$path: "src/client",
			},
		},
	},
};

/** Configuration with multiple partitions */
export const multiPartitionConfig = {
	name: "MultiPartition",
	tree: {
		$className: "DataModel",
		ReplicatedStorage: {
			$className: "ReplicatedStorage",
			Lib1: {
				$path: "packages/lib1",
			},
			Lib2: {
				$path: "packages/lib2",
			},
		},
		ServerScriptService: {
			$className: "ServerScriptService",
			$path: "src/server",
		},
	},
};

/** Configuration with optional paths */
export const optionalPathConfig = {
	name: "OptionalPaths",
	tree: {
		$className: "DataModel",
		ServerStorage: {
			$className: "ServerStorage",
			OptionalDir: {
				$path: {
					optional: "src/optional",
				},
			},
		},
	},
};

/** Configuration with isolated containers */
export const isolatedContainersConfig = {
	name: "IsolatedTest",
	tree: {
		$className: "DataModel",
		StarterGui: {
			$className: "StarterGui",
			$path: "src/starter-gui",
		},
		StarterPack: {
			$className: "StarterPack",
			$path: "src/starter-pack",
		},
	},
};

/** Configuration with client and server containers */
export const networkTypeConfig = {
	name: "NetworkTest",
	tree: {
		$className: "DataModel",
		ServerScriptService: {
			$className: "ServerScriptService",
			$path: "src/server-scripts",
		},
		ServerStorage: {
			$className: "ServerStorage",
			$path: "src/server-storage",
		},
		StarterPlayer: {
			$className: "StarterPlayer",
			StarterPlayerScripts: {
				$className: "StarterPlayerScripts",
				$path: "src/client",
			},
		},
	},
};

/** Nested project configuration */
export const nestedProjectConfig = {
	name: "NestedProject",
	tree: {
		Workspace: {
			$className: "Workspace",
			Level1: {
				Level2: {
					Level3: {
						$path: "src/deep/nested/path",
					},
				},
			},
		},
	},
};

/** Invalid config - missing name */
export const invalidConfigMissingName = {
	tree: {
		$path: "src",
	},
};

/** Invalid config - missing tree */
export const invalidConfigMissingTree = {
	name: "NoTree",
};

/** Invalid config - wrong types */
export const invalidConfigWrongTypes = {
	name: 123,
	tree: {
		$path: "src",
	},
};

/** Creates a simple tree for testing */
export function createSimpleTree(path: string): RojoTree {
	return {
		$path: path,
	} as RojoTree;
}

/** Creates a tree with className */
export function createTreeWithClassName(treeClassName: string, path?: string): RojoTree {
	const tree = {
		$className: treeClassName,
	} as Partial<RojoTree>;
	if (path !== undefined) {
		tree.$path = path;
	}

	return tree as RojoTree;
}

/** Mock file system structure for testing */
export const mockFileSystem = {
	"/project/default.project.json": JSON.stringify(gameRojoConfig),
	"/project/src/client/init.client.luau": "",
	"/project/src/client/ui.luau": "",
	"/project/src/server/handler.luau": "",
	"/project/src/server/init.server.luau": "",
	"/project/src/shared/module.luau": "",
};

/** Common file paths for testing */
export const testFilePaths = {
	clientScript: "src/client/init.client.luau",
	jsonModule: "src/data/config.json",
	module: "src/shared/module.luau",
	nestedModule: "src/shared/utils/helper.luau",
	serverScript: "src/server/init.server.luau",
	tomlModule: "src/data/settings.toml",
};

/** Common Roblox paths for testing */
export const testRbxPaths = {
	game: ["game"],
	replicatedStorage: ["game", "ReplicatedStorage"],
	serverScriptService: ["game", "ServerScriptService"],
	starterPlayer: ["game", "StarterPlayer"],
	workspace: ["game", "Workspace"],
};
