'use_strict';

const stringify = require('json-stringify-safe');
const str = require('./str');
const debug = require('@dabh/diagnostics')('generic:utils');

// see: https://italonascimento.github.io/applying-a-timeout-to-your-promises/
async function promiseTimeout(ms, promise) {
  // Create a promise that rejects in <ms> milliseconds
  debug(`Create a promise that rejects in ${ms} milliseconds`);
  const timeout = new Promise((resolve, reject) => {
    const id = setTimeout(() => {
      clearTimeout(id);
      reject('Provider timed out');
    }, ms);
  });

  // Returns a race between our timeout and the passed in promise
  return Promise.race([
    promise,
    timeout,
  ]);
}

function cloneJSON(item) {
  return JSON.parse(stringify(item));
}

function mergeObjects(baseObj, toMergeObj) {
  if (!baseObj && toMergeObj) return cloneJSON(toMergeObj);
  if (!toMergeObj) return cloneJSON(baseObj);

  const result = cloneJSON(baseObj);
  Object.keys(toMergeObj).map((key) => result[key] = toMergeObj[key]);
  return result;
}

/**
 * Turn object into an array.
 */

function toArray(obj) {
  return Object.keys(obj).map((key) => ({
    key,
    val: obj[key],
  }));
}

/**
 * string capilalize
 *
 * @param {*} string
 */
function capitalize(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
 * stringw/ separator to camelCase
 *
 * @param {*} string
 * @param {*} separator
 */
function toCamelCase(string, separator) {
  const tokens = string.split(separator).map((x) => x.toLowerCase());
  const temp = tokens.map((x) => x.charAt(0).toUpperCase() + x.slice(1)).join('');
  return temp.charAt(0).toLowerCase() + temp.slice(1);
}

function prepareObjToDynamo(jsonObj) {
  try {
    const fixedObj = JSON.parse(stringify(jsonObj));
    return JSON.parse(JSON.stringify(fixedObj, (k, v) => ((v === '') ? null : v)));
  } catch (e) {
    debug(e.stack, 'in prepareObjToDynamo');
    throw e;
  }
}

const arrayIntercept = (list1 = [], list2 = [], fn = (a, b) => a === b) => list1.filter((x) => list2.find((y) => fn(x, y)));
const arrayDiff = (list1 = [], list2 = [], fn = (a, b) => a === b) => list1.filter((x) => !list2.find((y) => fn(x, y)));

const isArray = (obj) => Array.isArray(obj);
const isObject = (obj) => typeof obj === 'object' && !isArray(obj);
const clone = (obj) => (obj ? JSON.parse(JSON.stringify(obj)) : obj);

const include = (path, includes, except) => {
  includes = includes || [];
  except = except || [];

  const softInclude = (p) => {
    if (includes.length === 0) return true;
    return includes.find((prefix) => {
      const result = p.startsWith(prefix);
      // console.log(`   ...........[+] ${p} startsWith ${prefix}: included (${result})`);
      return result;
    });
  };
  const softExclude = (p) => {
    if (except.length === 0) return false;
    return except.find((prefix) => {
      const result = p.startsWith(prefix);
      // console.log(`   ...........[-] ${p} startsWith ${prefix}: excluded (${result})`);
      return result;
    });
  };

  // console.log(` > check inclusion ${path}: ADD [${includes}], EXCEPTS [${except}]`);

  const result = softInclude(path) && !softExclude(path);
  // console.log(`   -> ${path} IN [${includes}] EXCEPT [${except}]: (${result})`);

  return result;
};

const project = (source, dest, includes = [], except = [], path = '') => {
  // console.log(' ------- [CLONES] --------');
  // if (includes.length === 0 && except.length === 0) return clone(source);
  Object.keys(source).forEach((k) => {
    const currentPath = path === '' ? k : `${path}.${k}`;
    // console.log(' + fullPath', currentPath);

    const oa = source[k];
    if (isObject(oa)) {
      dest[k] = project(oa, {}, includes, except, currentPath);
    } else if (include(currentPath, includes, except)) {
      dest[k] = clone(oa);
    }
    if (JSON.stringify(dest[k]) === '{}') delete dest[k];
  });
  return dest;
};

/**
 *
 * @param {array} chain
 * @param {Object} opt
 * @param {boolean} opt.leafFirst
 * @param {string} opt.parent
 * @returns
 */
const chainAssemble = (chain, opt) => {
  opt.leafFirst = opt.leafFirst !== false;
  opt.parentCondition = (a, b) => b.parentId === a.agencyId;
  opt.leafCondition = (a, b) => a.agencyId === a.initAgency
    || a.parentId === b.agencyId
    || b.parentId === b.agencyId;

  const leafFirstOrder = (a, b) => {
    if (opt.leafCondition(a, b)) {
      return -1;
    }
    if (opt.parentCondition(a, b)) {
      return 1;
    }
    return 0;
  };

  return opt.leafFirst
    ? chain.sort((a, b) => leafFirstOrder(a, b))
    : chain.sort((a, b) => leafFirstOrder(a, b)).reverse();
};

const arrayRemoveElement = (fn) => (array, element) => {
  const idx = array.findIndex((x) => fn(x, element));
  // console.log(`array: ${array}`);
  // console.log(`elem: ${element}`);
  // console.log(`idx=${idx}`);
  // console.log('-------------------');
  if (idx === -1) return array;
  return array.slice(0, idx).concat(array.slice(idx + 1));
};

const unique = (items, hasher) => {
  const resultHash = {};
  const results = [];

  items.forEach((item) => {
    if (!(hasher(item) in resultHash)) {
      resultHash[hasher(item)] = true;
      results.push(item);
    }
  });

  return results;
};

module.exports = {
  isObject: (obj) => (!!obj) && (obj.constructor === Object),
  isEmpty: (obj) => [Object, Array].includes((obj || {}).constructor) && !Object.entries((obj || {})).length,
  promiseTimeout,
  cloneJSON,
  mergeObjects,
  toArray,
  capitalize,
  toCamelCase,
  stringifySafe: stringify,
  arrayDiff,
  arrayIntercept,
  arrayRemoveElement,
  prepareObjToDynamo,
  str,
  projector: (includes, except) => (item) => project(item, {}, includes, except),
  chainAssemble,
  unique,
};
