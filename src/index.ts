import { Store, ProviderCallback } from "./store.js";
import { deserialize, serialize as serializeHash } from "./hash.js";
import { SchemaConfig } from "./schema.js";
export { FieldConfig } from './field.js'

let store: Store;

/**
 * Clear all providers and state.
 */
export function reset() {
	if (store) {
		window.removeEventListener("popstate", update);
	}
	window.addEventListener("popstate", update);
	store = new Store(deserialize(location.hash), function (values, defaults) {
		const nonDefaults: Record<string, any> = {};
		for (const key in values) {
			if (values[key] !== defaults[key]) {
				nonDefaults[key] = values[key];
			}
		}
		history.pushState(values, "", serializeHash(nonDefaults));
	});
}

function update() {
	store.update(deserialize(location.hash));
}

/**
 * Register a new state provider.
 *
 * @param config Definition for the state "schema" (default values and types for
 * each field). The config object takes two forms, depending on whether or not
 * you want the default serializers and deserializers.
 * @param callback A function that is called when the URL hash is updated. The
 * object properties represent new state values. The object will not include
 * property values that have not changed.
 * @return A function that should be called whenever a component's state
 * changes. The URL hash will be updated with serialized versions of the state
 * values.
 *
 * @remarks
 * Components that want to initialize their state by deserializing values from
 * the URL hash or persist their state by serializing values to the URL hash
 * register themselves by calling {@link register}. Multiple components (that
 * may not know about one another) can register for "slots" in the hash.
 *
 * Without custom serializers or deserializers, the config is an objects with
 * property values representing the default state.  For example, if your state
 * is represented by a "start" date of Jan 1, 2000 and a "count" value of 42,
 * your `config` would look like this:
 *
 * ```js
 * const config = {
 *   start: new Date(Date.UTC(2000, 0, 1)),
 *   count: 42
 * };
 * ```
 *
 * If you don't want to use the build-in functions for serializing and
 * deserializing values, use an object with `default`, `serialize`, and
 * `deserialize` properties.  The `default` value represents the default value
 * (if none is present in the URL).  The `serialize` function is called with your
 * state value and returns a string for the URL.  The `deserialize` function is
 * called with a string and returns the value for your state.
 */
export function register(config: SchemaConfig, callback: ProviderCallback): ProviderCallback {
	return store.register(config, callback);
}

/**
 * Unregister an existing state provider.
 * @param callback Callback registered by the provider.
 */
export function unregister(callback: ProviderCallback): void {
	store.unregister(callback);
}

/**
 * Serialize values as they would be represented in the hash.
 * @param values An object with values to be serialized.
 * @return The values as they would be represented in the hash.
 */
export function serialize(values: Record<string, any>): string {
	return serializeHash(store.serialize(values));
}

reset();

export { ProviderCallback, SchemaConfig }
