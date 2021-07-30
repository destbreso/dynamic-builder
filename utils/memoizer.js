const debug = require('@dabh/diagnostics')('memo');
const md5 = require('md5');

const Cache = () => {
  const state = {};
  return {
    put: (key, value) => { state[key] = value; },
    get: (key) => state[key],
  };
};

const makeKey = (hashFn, args) => {
  if (!hashFn) {
    return md5(JSON.stringify(args));
  }
  return JSON.stringify(hashFn(args));
};

const Memoizer = (function () {
  // private
  const cache = Cache();
  function cacher(fn, opt) {
    return function () {
      const key = makeKey(opt.hash, arguments);
      // debug('cache', cache.state());
      if (cache.get(key)) {
        debug('load from cahe');
        return cache.get(key);
      }
      debug('execute function');

      const val = fn.apply(this, arguments);
      cache.put(key, val);
      return val;
    };
  }
  // public
  return {
    memo(fn, opt = {}) {
      return cacher(fn, opt);
    },
  };
}());

module.exports = Memoizer;

// Example
let fib = (n) => { if (n < 2) return 1; return fib(n - 2) + fib(n - 1); };
// fib = Memoizer.memo(fib);
// fib(10);

fib = Memoizer.memo(fib, {
  hash: (args) => args[0],
});
fib(10);
