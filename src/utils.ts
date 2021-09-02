const dateTag = '[object Date]';

const objToString = Object.prototype.toString;

/**
 * Get the type of a value.
 * @param value The value.
 * @returns The type.
 *
 * @internal
 */
export function typeOf(value: any): "object" | "array" | "date" | "string" | "number" | "boolean" | "bigint" | "symbol" | "undefined" | "function" {
    const type = typeof value;
    if (type === "object") {
        if (Array.isArray(value)) {
            return "array";
        }
        if (objToString.call(value) === dateTag) {
            return "date";
        }
    }
    return type;
}

/**
 * Copy properties from one object to another.
 * @param dest The destination object.
 * @param source The source object.
 * @returns The destination object.
 *
 * @internal
 */
export function extend(dest: any, source: any): any {
    for (const key of Object.keys(source)) {
        dest[key] = source[key];
    }
    return dest;
}

/**
 * Generate an array of alternating name, value from an object's properties.
 * @param obj The object to zip.
 * @returns The array of name, value [, name, value]*.
 *
 * @internal
 */
export function zip(obj: Record<string, any>): any[] {
    const zipped = [];
    let count = 0;
    for (const key of Object.keys(obj)) {
        zipped[2 * count] = key;
        zipped[2 * count + 1] = obj[key];
        ++count;
    }
    return zipped;
}

/**
 * Generate an object from an array of alternating name, value items.
 * @param arr The array of name, value [, name, value]*.
 * @returns The zipped up object.
 *
 * @internal
 */
export function unzip(arr: any[]): Record<string, any> {
    const obj: any = {};
    for (let i = 0, ii = arr.length; i < ii; i += 2) {
        obj[arr[i]] = arr[i + 1];
    }
    return obj;
}