import { Field, FieldConfig } from './field.js'
import { extend } from './utils.js'

/**
 * Configuration for a Schema.
 *
 * Is a dictionary of name to field.
 */
export type SchemaConfig = Record<string, FieldConfig> & { _?: string };

/**
 * @internal
 */
export class Schema {
    private fields: Record<string, Field>;
    private prefix: string | undefined;

    /**
     * Create a new schema.  A schema is a collection of field definitions.
     * @param config Keys are field names, values are field configs.
     */
    constructor(config: SchemaConfig) {
        config = extend({}, config);
        this.fields = {};
        if ("_" in config) {
            this.prefix = config._;
            delete config._;
        }
        for (const key of Object.keys(config)) {
            this.fields[key] = new Field(config[key]);
        }
    }

    /**
     * Get the prefixed version of a key.
     * @param key The key.
     * @return The prefixed key.
     */
    getPrefixed(key: string): string {
        return this.prefix ? this.prefix + "." + key : key;
    }

    /**
     * Call a callback for each field key.
     * @param callback Called with a local field key and
     *     a prefixed key. Breaks out of the loop if returns false.
     * @param thisArg This argument for the callback.
     */
    forEachKey(callback: (key: string, prefixed: string) => boolean, thisArg?: any): void {
        for (const key of Object.keys(this.fields)) {
            if (!callback.call(thisArg, key, this.getPrefixed(key))) {
                return;
            }
        }
    }

    /**
     * Serialize a value.
     * @param key The key or field name.
     * @param value The value to serialize.
     * @return The serialized value.
     */
    serialize(key: string, value: any): string {
        if (key in this.fields) {
            return this.fields[key].serialize(value);
        }
        throw new Error("Unknown key: " + key);
    }

    /**
     * Deserialize a value.
     * @param key The key or field name.
     * @param str The serialized value.
     * @return The deserialized value.
     */
    deserialize(key: string, str: string): any {
        if (key in this.fields) {
            return this.fields[key].deserialize(str);
        }
        throw new Error("Unknown key: " + key);
    }

    /**
     * Get the default value for a particular field.
     * @param key The key or field name.
     * @return The default value.
     */
    getDefault(key: string): any {
        if (key in this.fields) {
            return this.fields[key].default;
        }
        throw new Error("Unknown key: " + key);
    }

    /**
     * Determine if one schema conflicts with another.  Two schemas conflict if
     * any of their prefixed keys are the same.
     * @param other The other schema.
     * @return This schema conflicts with the other.  If the two
     *     schemas conflict, the return will be the first conflicting key (with
     *     any prefix).
     */
    conflicts(other: Schema): boolean | string {
        const thisPrefixedKeys: Record<string, boolean> = {};
        for (const key in this.fields) {
            thisPrefixedKeys[this.getPrefixed(key)] = true;
        }

        let conflicts: boolean | string = false;
        other.forEachKey(function(_: string, prefixed: string): boolean {
            if (prefixed in thisPrefixedKeys) {
                conflicts = prefixed;
            }
            return !conflicts;
        });
        return conflicts;
    }
}