import { Schema, SchemaConfig } from "./schema.js";
import { typeOf } from "./utils.js";
import { getSerializer } from "./serializers.js";

/**
 * @internal
 */
export type StoreCallback = (values: Record<string, any>, defaults: Record<string, any>) => void;
/**
 * Callback for handling when the hash has changed.
 *
 * @param values Values that have changed.
 */
export type ProviderCallback = (values: Record<string, any>) => void;

/**
 * @internal
 */
export interface Provider {
	schema: Schema;
	callback: ProviderCallback;
}

/**
 * @internal
 */
export class Store {
	private values: Record<string, any>;
	private defaults: Record<string, any> = {};
	private providers: Provider[] = [];
	private callback: StoreCallback;
	private callbackTimer: number | null = null;
	private updateTimer: number | null = null;

    /**
     * An object backed store of string values.  Allows registering multiple state
     * providers.
     * @param values Initial serialized values.
     * @param callback Called with an object of serialized
     *     values and defaults whenever a provider updates state.
     */
	constructor(values: Record<string, any>, callback: StoreCallback) {
		this.values = values;
		this.callback = callback;
	}

	private scheduleCallback(): void {
		if (this.callbackTimer) {
			clearTimeout(this.callbackTimer);
		}
		this.callbackTimer = setTimeout(this.debouncedCallback.bind(this));
	}

	private debouncedCallback(): void {
		this.callbackTimer = null;
		this.callback(this.values, this.defaults);
	}

	update(values: Record<string, any>): void {
		if (this.updateTimer) {
			clearTimeout(this.updateTimer);
		}
		this.updateTimer = setTimeout(this.debouncedUpdate.bind(this, values));
	}

	private debouncedUpdate(newValues: Record<string, any>): void {
		this.updateTimer = null;
		const values = this.values;
		const providers = this.providers.slice(); // callbacks may unregister providers
		for (let i = providers.length - 1; i >= 0; --i) {
			const provider = providers[i];
			const schema = provider.schema;
			let changed = false;
			const state: Record<string, any> = {};
			schema.forEachKey(function (key: string, prefixed: string): boolean {
				let deserialized;
				if (!(prefixed in newValues)) {
					deserialized = schema.getDefault(key);
					const serializedDefault = schema.serialize(key, deserialized);
					if (values[prefixed] !== serializedDefault) {
						changed = true;
						values[prefixed] = serializedDefault;
						state[key] = deserialized;
					}
				} else if (values[prefixed] !== newValues[prefixed]) {
					try {
						deserialized = schema.deserialize(key, newValues[prefixed]);
						values[prefixed] = newValues[prefixed];
						state[key] = deserialized;
						changed = true;
					} catch (err) {
						// invalid value, pass
					}
				}
				return true;
			});
			if (changed && this.providers.indexOf(provider) >= 0) {
				provider.callback(state);
			}
		}
	}

    /**
     * Unregister a provider.  Deletes the provider's values from the underlying
     * store and calls the store's callback.
     * @param callback The provider's callback.
     */
	unregister(callback: ProviderCallback): void {
		let removedProvider: Provider | undefined;
		this.providers = this.providers.filter(function (provider) {
			const remove = provider.callback === callback;
			if (remove) {
				removedProvider = provider;
			}
			return !remove;
		});
		if (!removedProvider) {
			throw new Error("Unable to unregister hashed state provider");
		}
		const values = this.values;
		const defaults = this.defaults;
		removedProvider.schema.forEachKey(function (_: string, prefixed: string): boolean {
			delete values[prefixed];
			delete defaults[prefixed];
			return true;
		});
		this.scheduleCallback();
	}

    /**
     * Register a new state provider.
     * @param config Schema config.
     * @param callback Called by the store on state changes.
     * @return Called by the provider on state changes.
     */
	register(config: SchemaConfig, callback: ProviderCallback): ProviderCallback {
		const provider = {
			schema: new Schema(config),
			callback: callback,
		};

		// ensure there are no conflicts with existing providers
		for (let i = 0, ii = this.providers.length; i < ii; ++i) {
			const conflicts = provider.schema.conflicts(this.providers[i].schema);
			if (conflicts) {
				throw new Error(
					"Provider already registered using the same name: " + conflicts
				);
			}
			if (provider.callback === this.providers[i].callback) {
				throw new Error("Provider already registered with the same callback");
			}
		}

		this.providers.push(provider);
		this.initializeProvider(provider);

		return function update(this: Store, state: Record<string, any>) {
			if (this.providers.indexOf(provider) === -1) {
				throw new Error("Unregistered provider attempting to update state");
			}
			const schema = provider.schema;
			let changed = false;
			const values = this.values;
			schema.forEachKey(function (key: string, prefixed: string): boolean {
				if (key in state) {
					const serializedValue = schema.serialize(key, state[key]);
					if (values[prefixed] !== serializedValue) {
						changed = true;
						values[prefixed] = serializedValue;
					}
				}
				return true;
			});
			if (changed) {
				this.scheduleCallback();
			}
		}.bind(this);
	}

    /**
     * Call provider with initial values.
     * @param provider Provider to be initialized.
     */
	private initializeProvider(provider: Provider): void {
		const state: Record<string, any> = {};
		const defaults: Record<string, any> = {};
		const values = this.values;
		provider.schema.forEachKey(function (key: string, prefixed: string): boolean {
			let deserializedValue;
			const deserializedDefault = provider.schema.getDefault(key);
			const serializedDefault = provider.schema.serialize(
				key,
				deserializedDefault
			);
			if (prefixed in values) {
				try {
					deserializedValue = provider.schema.deserialize(key, values[prefixed]);
				} catch (err) {
					deserializedValue = deserializedDefault;
				}
			} else {
				deserializedValue = deserializedDefault;
			}
			state[key] = deserializedValue;
			defaults[prefixed] = serializedDefault;
			values[prefixed] = provider.schema.serialize(key, deserializedValue);
			return true;
		});
		for (const prefixed in defaults) {
			this.defaults[prefixed] = defaults[prefixed];
		}
		provider.callback(state);
	}

	serialize(values: Record<string, any>): Record<string, string> {
		const serialized: Record<string, string> = {};
		for (let i = 0, ii = this.providers.length; i < ii; ++i) {
			const provider = this.providers[i];
			provider.schema.forEachKey(function (key: string, prefixed: string): boolean {
				if (prefixed in values) {
					serialized[prefixed] = provider.schema.serialize(key, values[prefixed]);
				}
				return true;
			});
		}
		for (const key in values) {
			if (!(key in serialized)) {
				const value = values[key];
				const type = typeOf(value);
				const serializer: (v: any) => string = getSerializer(type);
				serialized[key] = serializer(value);
			}
		}
		return serialized;
	}
}
