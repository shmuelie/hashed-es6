import { typeOf } from "./utils.js";

const serializers = {
	string: function (str: string): string {
		if (typeof str !== "string") {
			throw new Error("Expected string to serialize: " + str);
		}
		return encodeURIComponent(str);
	},
	number: function (num: number): string {
		if (typeof num !== "number") {
			throw new Error("Expected number to serialize: " + num);
		}
		return encodeURIComponent(String(num));
	},
	boolean: function (bool: boolean): string {
		if (typeof bool !== "boolean") {
			throw new Error("Expected boolean to serialize: " + bool);
		}
		return bool ? "1" : "0";
	},
	date: function (date: Date): string {
		if (typeOf(date) === "date") {
			throw new Error("Expected date to serialize: " + date);
		}
		return encodeURIComponent(date.toISOString());
	},
	array: function (array: object[]): string {
		if (typeOf(array) === "array") {
			throw new Error("Expected array to serialize: " + array);
		}
		return encodeURIComponent(JSON.stringify(array));
	},
	object: function (obj: object): string {
		return encodeURIComponent(JSON.stringify(obj));
	},
    bigint: function (_: BigInt): string {
        throw new Error("Unable to serialize type: bigint");
    },
    symbol: function (_: Symbol): string {
        throw new Error("Unable to serialize type: symbol");
    },
    undefined: function (_: undefined): string {
        throw new Error("Unable to serialize type: undefined");
    },
    function: function (_: Function): string {
        throw new Error("Unable to serialize type: function");
    }
};

function noop() {
    //NOOP
}

const deserializers = {
	string: function (str: string): string {
		if (!str || typeof str !== "string") {
			throw new Error("Expected string to deserialize: " + str);
		}
		return decodeURIComponent(str);
	},
	number: function (str: string): number {
		if (!str || typeof str !== "string") {
			throw new Error("Expected string to deserialize: " + str);
		}
		const num = Number(decodeURIComponent(str));
		if (isNaN(num)) {
			throw new Error("Expected to deserialize a number: " + str);
		}
		return num;
	},
	boolean: function (str: string): boolean {
		if (!str || typeof str !== "string") {
			throw new Error("Expected string to deserialize: " + str);
		}
		let bool: boolean;
		if (str === "1") {
			bool = true;
		} else if (str === "0") {
			bool = false;
		} else {
			throw new Error('Expected "1" or "0" for boolean: ' + str);
		}
		return bool;
	},
	date: function (str: string): Date {
		if (!str || typeof str !== "string") {
			throw new Error("Expected string to deserialize: " + str);
		}
		const date = new Date(decodeURIComponent(str));
		if (isNaN(date.getTime())) {
			throw new Error("Expected to deserialize a date: " + str);
		}
		return date;
	},
	array: function (str: string): object[] {
		if (!str || typeof str !== "string") {
			throw new Error("Expected string to deserialize: " + str);
		}
		let array: object[] | null = null;
		try {
			array = JSON.parse(decodeURIComponent(str));
		} catch (err) {
			noop();
		}
		if (!array || typeOf(array) !== "array") {
			throw new Error("Expected to deserialize an array: " + str);
		}
		return array;
	},
	object: function (str: string): object {
		if (!str || typeof str !== "string") {
			throw new Error("Expected string to deserialize: " + str);
		}
		let obj: object | null = null;
		try {
			obj = JSON.parse(decodeURIComponent(str));
		} catch (err) {
			noop();
		}
		if (!obj || typeOf(obj) !== "object") {
			throw new Error("Expected to deserialize an object: " + str);
		}
		return obj;
	},
    bigint: function (_: string): BigInt {
        throw new Error("Unable to deserialize type: bigint");
    },
    symbol: function (_: string): Symbol {
        throw new Error("Unable to deserialize type: symbol");
    },
    undefined: function (_: string): any {
        throw new Error("Unable to deserialize type: undefined");
    },
    function: function (_: string): Function {
        throw new Error("Unable to deserialize type: function");
    }
};

/**
 * @internal
 */
export type Deserializers = typeof deserializers[keyof typeof deserializers];
/**
 * @internal
 */
export type DeserializableTypes = ReturnType<Serializers>;
/**
 * @internal
 */
export type Serializers = typeof serializers[keyof typeof serializers];
/**
 * @internal
 */
export type SerializableTypes = ReturnType<Deserializers>;

/**
 * Get a deserializer for a value of the given type.
 * @param type Value type.
 * @return Function that deserializes a string to a value.
 *
 * @internal
 */
export function getDeserializer<K extends keyof typeof deserializers>(type: K): typeof deserializers[K] {
	if (type in deserializers) {
		return deserializers[type];
	}
	throw new Error("Unable to deserialize type: " + type);
}

/**
 * Get a serializer for a value of the given type.
 * @param type Value type.
 * @return Function that serializes a value to a string.
 *
 * @internal
 */
export function getSerializer<K extends keyof typeof serializers>(type: K): typeof serializers[K] {
	if (type in serializers) {
		return serializers[type];
	}
	throw new Error("Unable to serializers type: " + type);
}
