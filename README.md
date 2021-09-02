# hashed-es6

[![View this project on NPM](https://img.shields.io/npm/v/hashed-es6.svg)](https://www.npmjs.com/package/hashed-es6)
![NPM Version](https://img.shields.io/npm/dm/hashed-es6.svg)
![Issues Count](https://img.shields.io/github/issues/shmuelie/hashed-es6)
![License](https://img.shields.io/github/license/shmuelie/hashed-es6)
![Type Definitions](https://img.shields.io/npm/types/hashed-es6)

Serialize your application state in the URL hash.

Hashed-ES6 lets you register any number of providers and serializes their state in the URL hash. When your application loads (or if the URL changes by other means), the providers will be notified of the new state.

TypeScript port of [hashed](https://github.com/tschaub/hashed).

## Examples

### Single provider, default serializers and deserializers

The simplest use of hashed is to register a single state provider.  This example uses the built-in functions for transforming state values to strings for the URL (serializing) and transforming strings from the URL into state values (deserializing).

```js
const state = {
  count: 42,
  color: 'blue'
};

function listener(newState) {
  // called when the state in the URL is different than what we have
}

// register a state provider
const update = hashed.register(state, listener);

// When the state of your application changes, update the hash.
update({count: 43}); // URL hash will become #/count/43/color/blue
```

### Single provider, custom serializers and deserializers

The default serializers and deserializers work for primitive state values (string, boolean, number).  Dates will be serialized as ISO strings (and deserialized from the same).  Arrays and objects will be serialized with `JSON.stringify()` and deserialized with `JSON.parse()`.  You can override this behavior if you want to have prettier URLs or to serialize complex or cyclic data.

```js
// Assume your state has a "colors" array and
// you don't want JSON serialization in the URL.
const config = {
  colors: {
    default: [] // no colors by default
    serialize: function(colors) {
      // Instead of JSON, you want comma delimited values.
      // Note that if you expect strings that should be encoded,
      // use encodeURIComponent here.
      return colors.join(',');
    },
    deserialize: function(string) {
      // Note that if you use encodeURIComponent above in serialize,
      // you should use decodeURIComponent here.
      return string.split(',');
    }
  }
};

// register a state provider
const update = hashed.register(config, function(state) {
  // this will get called with a "colors" array
});

update(['green', 'blue']); // URL hash will become #/colors/green,blue
```
