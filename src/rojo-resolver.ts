import fs from "node:fs";
import path from "node:path";

import {
	CLIENT_CONTAINERS,
	DEFAULT_ISOLATED_CONTAINERS,
	INIT_NAME,
	ROJO_DEFAULT_NAME,
	ROJO_FILE_REGEX,
	ROJO_OLD_NAME,
	SERVER_CONTAINERS,
} from "./constants";
import {
	RbxType,
	ROJO_MODULE_EXTS,
	ROJO_SCRIPT_EXTS,
	stripRojoExtensions,
	SUB_EXT_TYPE_MAP,
} from "./extensions";
import { FileRelation, NetworkType, RbxPathParent as RbxPathParentSymbol } from "./types";
import type { PartitionInfo, RbxPath, RbxPathParent, RelativeRbxPath, RojoTree } from "./types";
import { arrayStartsWith, convertToLuau, isPathDescendantOf } from "./utils";
import { ajv, isValidRojoConfig, validateRojo } from "./validation";

export { FileRelation, NetworkType, RbxPathParent } from "./types";
export type { RbxPath, RelativeRbxPath } from "./types";

export class RojoResolver {
	private readonly filePathToRbxPathMap = new Map<string, RbxPath>();
	private readonly isolatedContainers = [...DEFAULT_ISOLATED_CONTAINERS];
	private readonly partitions = new Array<PartitionInfo>();
	private readonly rbxPath = new Array<string>();
	private readonly warnings = new Array<string>();

	public isGame = false;

	public static findRojoConfigFilePath(projectPath: string): {
		path: string | undefined;
		warnings: Array<string>;
	} {
		const warnings = new Array<string>();

		const defaultPath = path.join(projectPath, ROJO_DEFAULT_NAME);
		if (fs.existsSync(defaultPath)) {
			return { path: defaultPath, warnings };
		}

		const candidates = new Array<string | undefined>();
		for (const fileName of fs.readdirSync(projectPath)) {
			if (
				fileName !== ROJO_DEFAULT_NAME &&
				(fileName === ROJO_OLD_NAME || ROJO_FILE_REGEX.test(fileName))
			) {
				candidates.push(path.join(projectPath, fileName));
			}
		}

		if (candidates.length > 1) {
			warnings.push(`Multiple *.project.json files found, using ${candidates[0]}`);
		}

		return { path: candidates[0], warnings };
	}

	public static fromPath(rojoConfigFilePath: string): RojoResolver {
		const resolver = new RojoResolver();
		resolver.parseConfig(path.resolve(rojoConfigFilePath), true);
		return resolver;
	}

	public static fromTree(basePath: string, tree: RojoTree): RojoResolver {
		const resolver = new RojoResolver();
		resolver.parseTree(basePath, "", tree, true);
		return resolver;
	}

	public getFileRelation(fileRbxPath: RbxPath, moduleRbxPath: RbxPath): FileRelation {
		const fileContainer = this.getContainer(this.isolatedContainers, fileRbxPath);
		const moduleContainer = this.getContainer(this.isolatedContainers, moduleRbxPath);
		if (fileContainer && moduleContainer) {
			if (fileContainer === moduleContainer) {
				return FileRelation.InToIn;
			}

			return FileRelation.OutToIn;
		}

		if (fileContainer && !moduleContainer) {
			return FileRelation.InToOut;
		}

		if (!fileContainer && moduleContainer) {
			return FileRelation.OutToIn;
		}

		// !fileContainer && !moduleContainer
		return FileRelation.OutToOut;
	}

	public getNetworkType(rbxPath: RbxPath): NetworkType {
		if (this.getContainer(SERVER_CONTAINERS, rbxPath)) {
			return NetworkType.Server;
		}

		if (this.getContainer(CLIENT_CONTAINERS, rbxPath)) {
			return NetworkType.Client;
		}

		return NetworkType.Unknown;
	}

	public getPartitions(): ReadonlyArray<PartitionInfo> {
		return this.partitions;
	}

	public getRbxPathFromFilePath(filePath: string): RbxPath | undefined {
		filePath = path.resolve(filePath);
		filePath = convertToLuau(filePath);

		const rbxPath = this.filePathToRbxPathMap.get(filePath);
		if (rbxPath) {
			return rbxPath;
		}

		const extension = path.extname(filePath);
		for (const partition of this.partitions) {
			if (isPathDescendantOf(filePath, partition.fsPath)) {
				const stripped = stripRojoExtensions(filePath);
				const relativePath = path.relative(partition.fsPath, stripped);
				const relativeParts = relativePath === "" ? [] : relativePath.split(path.sep);
				if (ROJO_SCRIPT_EXTS.has(extension) && relativeParts.at(-1) === INIT_NAME) {
					relativeParts.pop();
				}

				return partition.rbxPath.concat(relativeParts);
			}
		}

		return undefined;
	}

	public getRbxTypeFromFilePath(filePath: string): RbxType {
		filePath = convertToLuau(filePath);
		const extension = path.extname(filePath);
		const subExtension = path.extname(path.basename(filePath, extension));
		if (ROJO_SCRIPT_EXTS.has(extension)) {
			return SUB_EXT_TYPE_MAP.get(subExtension) ?? RbxType.Unknown;
		}

		// non-script exts cannot use .server, .client, etc.
		return RbxType.ModuleScript;
	}

	public getWarnings(): ReadonlyArray<string> {
		return this.warnings;
	}

	public isIsolated(rbxPath: RbxPath): boolean {
		return this.getContainer(this.isolatedContainers, rbxPath) !== undefined;
	}

	public static relative(rbxFrom: RbxPath, rbxTo: RbxPath): RelativeRbxPath {
		const maxLength = Math.max(rbxFrom.length, rbxTo.length);
		let diffIndex = maxLength;
		for (let index = 0; index < maxLength; index++) {
			if (rbxFrom[index] !== rbxTo[index]) {
				diffIndex = index;
				break;
			}
		}

		const result = new Array<RbxPathParent | string>();
		if (diffIndex < rbxFrom.length) {
			for (let index = 0; index < rbxFrom.length - diffIndex; index++) {
				result.push(RbxPathParentSymbol);
			}
		}

		for (let index = diffIndex; index < rbxTo.length; index++) {
			// eslint-disable-next-line ts/no-non-null-assertion -- Loop
			result.push(rbxTo[index]!);
		}

		return result;
	}

	/**
	 * Create a synthetic RojoResolver for ProjectType.Package. Forces all
	 * imports to be relative.
	 */
	public static synthetic(basePath: string): RojoResolver {
		const resolver = new RojoResolver();
		resolver.parseTree(basePath, "", { $path: basePath } as RojoTree, true);
		return resolver;
	}

	private getContainer(from: Array<RbxPath>, rbxPath?: RbxPath): RbxPath | undefined {
		if (this.isGame && rbxPath) {
			for (const container of from) {
				if (arrayStartsWith(rbxPath, container)) {
					return container;
				}
			}
		}

		return undefined;
	}

	private parseConfig(rojoConfigFilePath: string, doNotPush = false): void {
		const realPath = fs.realpathSync(rojoConfigFilePath);
		if (fs.existsSync(realPath)) {
			let configJson: unknown;
			try {
				configJson = JSON.parse(fs.readFileSync(realPath).toString());
			} finally {
				if (isValidRojoConfig(configJson)) {
					this.parseTree(
						path.dirname(rojoConfigFilePath),
						configJson.name,
						configJson.tree,
						doNotPush,
					);
				} else {
					this.warn(
						`RojoResolver: Invalid configuration! ${ajv.errorsText(validateRojo.get().errors)}`,
					);
				}
			}
		} else {
			this.warn(`RojoResolver: Path does not exist "${rojoConfigFilePath}"`);
		}
	}

	private parsePath(itemPath: string): void {
		itemPath = convertToLuau(itemPath);
		const realPath = fs.existsSync(itemPath) ? fs.realpathSync(itemPath) : itemPath;
		const extension = path.extname(itemPath);
		if (ROJO_MODULE_EXTS.has(extension)) {
			this.filePathToRbxPathMap.set(itemPath, [...this.rbxPath]);
			return;
		}

		const isDirectory = fs.existsSync(realPath) && fs.statSync(realPath).isDirectory();
		if (isDirectory && fs.readdirSync(realPath).includes(ROJO_DEFAULT_NAME)) {
			this.parseConfig(path.join(itemPath, ROJO_DEFAULT_NAME), true);
			return;
		}

		this.partitions.unshift({
			fsPath: itemPath,
			rbxPath: [...this.rbxPath],
		});

		if (isDirectory) {
			this.searchDirectory(itemPath);
		}
	}

	private parseProjectJsonInDirectory(directory: string, children: Array<string>): void {
		for (const child of children) {
			const childPath = path.join(directory, child);
			const childRealPath = fs.realpathSync(childPath);
			if (
				fs.statSync(childRealPath).isFile() &&
				child !== ROJO_DEFAULT_NAME &&
				ROJO_FILE_REGEX.test(child)
			) {
				this.parseConfig(childPath);
			}
		}
	}

	private parseTree(basePath: string, name: string, tree: RojoTree, doNotPush = false): void {
		if (!doNotPush) {
			this.rbxPath.push(name);
		}

		if (tree.$path !== undefined) {
			this.parsePath(
				path.resolve(
					basePath,
					typeof tree.$path === "string" ? tree.$path : tree.$path.optional,
				),
			);
		}

		if (tree.$className === "DataModel") {
			this.isGame = true;
		}

		for (const childName of Object.keys(tree).filter((key) => !key.startsWith("$"))) {
			// eslint-disable-next-line ts/no-non-null-assertion -- Loop
			this.parseTree(basePath, childName, tree[childName]!);
		}

		if (!doNotPush) {
			this.rbxPath.pop();
		}
	}

	private searchDirectory(directory: string, item?: string): void {
		const realPath = fs.realpathSync(directory);
		const children = fs.readdirSync(realPath);

		if (children.includes(ROJO_DEFAULT_NAME)) {
			this.parseConfig(path.join(directory, ROJO_DEFAULT_NAME));
			return;
		}

		if (item !== undefined) {
			this.rbxPath.push(item);
		}

		this.parseProjectJsonInDirectory(directory, children);
		this.searchSubdirectories(directory, children);

		if (item !== undefined) {
			this.rbxPath.pop();
		}
	}

	private searchSubdirectories(directory: string, children: Array<string>): void {
		for (const child of children) {
			const childPath = path.join(directory, child);
			const childRealPath = fs.realpathSync(childPath);
			if (fs.statSync(childRealPath).isDirectory()) {
				this.searchDirectory(childPath, child);
			}
		}
	}

	private warn(str: string): void {
		this.warnings.push(str);
	}
}
