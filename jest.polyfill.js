/** Polyfills required for Node environments without native Web APIs (like Node 16) */
process.env.EXPO_PUBLIC_USE_RN_FETCH = '1';

if (typeof global.FormData === 'undefined') {
  global.FormData = class FormData {
    constructor() {
      this._parts = [];
    }
    append(key, value) {
      this._parts.push([key, value]);
    }
  };
}

if (typeof global.Headers === 'undefined') {
  global.Headers = class Headers {
    constructor(init) {
      this._map = new Map();
      if (init) {
        if (init instanceof Headers) {
          init._map.forEach((v, k) => this._map.set(k, v));
        } else if (Array.isArray(init)) {
          init.forEach(([k, v]) => this._map.set(k.toLowerCase(), v));
        } else {
          Object.entries(init).forEach(([k, v]) => this._map.set(k.toLowerCase(), v));
        }
      }
    }
    append(k, v) { this._map.set(k.toLowerCase(), v); }
    get(k) { return this._map.get(k.toLowerCase()) || null; }
    has(k) { return this._map.has(k.toLowerCase()); }
    set(k, v) { this._map.set(k.toLowerCase(), v); }
  };
}

if (typeof global.Request === 'undefined') {
  global.Request = class Request {};
}

if (typeof global.Response === 'undefined') {
  global.Response = class Response {};
}
