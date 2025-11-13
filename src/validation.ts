import Ajv from "ajv";
import fs from "node:fs";

import { SCHEMA_PATH } from "./constants";
import { Lazy } from "./lazy";
import type { RojoFile } from "./types";

const ajv = new Ajv();

// eslint-disable-next-line arrow-style/arrow-return-style -- False positive
export const validateRojo = new Lazy(() => {
	return ajv.compile(JSON.parse(fs.readFileSync(SCHEMA_PATH).toString()) as any);
});

export function isValidRojoConfig(value: unknown): value is RojoFile {
	return validateRojo.get()(value);
}

export { ajv };
