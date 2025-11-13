/** Represents a roblox tree path. */
export type RbxPath = ReadonlyArray<string>;

export type RelativeRbxPath = ReadonlyArray<RbxPathParent | string>;

export const RbxPathParent = Symbol("Parent");
export enum FileRelation {
	/* absolute */
	OutToOut,
	/* error */
	OutToIn,
	/* absolute */
	InToOut,
	/* relative */
	InToIn,
}

export enum NetworkType {
	Unknown,
	Client,
	Server,
}

export interface PartitionInfo {
	fsPath: string;
	rbxPath: RbxPath;
}

export type RbxPathParent = typeof RbxPathParent;

export interface RojoFile {
	name: string;
	servePort?: number;
	tree: RojoTree;
}

export type RojoTree = RojoTreeMembers & RojoTreeMetadata;

export interface RojoTreeMembers {
	[name: string]: RojoTree;
}

export interface RojoTreeMetadata {
	$className?: string;
	$ignoreUnknownInstances?: boolean;
	$path?: string | { optional: string };
	$properties?: Array<RojoTreeProperty>;
}

export interface RojoTreeProperty {
	Type: string;
	Value: unknown;
}
