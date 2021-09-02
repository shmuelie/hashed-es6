import { unzip, zip } from "./utils.js";

/**
 * Get values from a hash string.
 * @param hash The hash string (e.g. '#/foo/bar').
 * @return The string values (e.g. {foo: 'bar'}).
 */
export function deserialize(hash: string): Record<string, any> {
	let zipped: string[];
	if (hash.length > 2) {
		const path = hash.substring(2);
		zipped = path.split("/");
	} else {
		zipped = [];
	}
	return unzip(zipped);
}

/**
 * Serialize values for the hash.
 * @param values The values to serialize.
 * @return The hash string.
 */
export function serialize(values: Record<string, any>): string {
	let path = "#";
	const parts = zip(values);
	if (parts.length > 0) {
		path = "#/" + parts.join("/");
	}
	return path;
}
