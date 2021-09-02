import { typeOf } from './utils.js'
import { SerializableTypes, getDeserializer, getSerializer} from './serializers.js'

/**
 * Configuration for a field.
 *
 * Can either be natively serializable type (string, number, Date, or boolean) or must be an object with a default, serialize, and deserialize members.
 */
export type FieldConfig = {
    /**
     * default value for when not set from hash.
     */
    default: any;
    /**
     * Method to serialize value to string.
     */
    serialize: (v: any) => string;
    /**
     * Method to deserialize value from string.
     */
    deserialize: (v: string) => any;
} | string | number | Date | boolean | any[];

/**
 * @internal
 */
export class Field {
    default: any;
    serialize: (v: any) => string;
    deserialize: (v: string) => any;

    /**
     * Create a new field.  A field must have a default value (`default`) and is
     * capable of serializing and deserializing values.
     * @param config Field configuration.  Must have a `default` property
     *     with a default value.  May have optional `serialize` and `deserialize`
     *     functions.  As a shorthand for providing a config object with a `default`
     *     property, a default value may be provided directly.
     */
    constructor(config: FieldConfig | SerializableTypes) {
        if (typeOf(config) !== "object") {
            this.default = config;
        } else if ("default" in config) {
            this.default = config.default;
        } else {
            throw new Error("Missing default");
        }
        const type = typeOf(this.default);
        this.serialize = "serialize" in config && config.serialize ? config.serialize : getSerializer(type);
        this.deserialize = "deserialize" in config && config.deserialize ? config.deserialize : getDeserializer(type);
    }
}