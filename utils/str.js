/* globals escape, unescape */

/**
 * Prototypes for strings.
 * (C) 2013 Alex Fernández.
 */

// requires
const util = require('util');
const crypto = require('crypto');
const core = require('./core.js');

// globals
const newRegExp = {};
const newString = {};

/**
 * Make a new regular expression which is global.
 */
newRegExp.makeGlobal = function () {
  return this.addOptions('g');
};

function addOptionIf(condition, option, options) {
  if (options.contains(option)) return options;
  if (!condition) return options;
  return options + option;
}

/**
 * Add the given options to a regular expression.
 */
newRegExp.addOptions = function (options) {
  options = addOptionIf(this.global, 'g', options);
  options = addOptionIf(this.ignoreCase, 'i', options);
  options = addOptionIf(this.multiline, 'm', options);
  options = addOptionIf(this.sticky, 'y', options);
  return new RegExp(this.source, options);
};

// add new functions to regexp prototype
core.addProperties(RegExp.prototype, newRegExp);

/**
 * Find out if the string has the parameter at the beginning.
 */
newString.startsWith = function (str) {
  return this.slice(0, str.length) == str;
};

/**
 * Find out if the string ends with the given parameter.
 */
newString.endsWith = function (str) {
  return this.slice(this.length - str.length) == str;
};

/**
 * Find out if the string contains the argument at any position.
 */
newString.contains = function (str) {
  return this.indexOf(str) != -1;
};

/**
 * Find out if the string contains the argument at any position,
 * ignoring case.
 */
newString.containsIgnoreCase = function (str) {
  return this.toLowerCase().indexOf(str.toLowerCase()) != -1;
};

/**
 * Return the piece of string until the argument is found.
 * 'hi.there'.substringUpTo('.') => 'hi'
 */
newString.substringUpTo = function (str) {
  if (!this.contains(str)) {
    return this;
  }
  return this.slice(0, this.indexOf(str));
};

/**
 * Return the piece of string up until the last occurrence of the argument.
 * 'hi.there.you'.substringUpToLast('.') => 'hi.there'
 */
newString.substringUpToLast = function (str) {
  if (!this.contains(str)) {
    return this;
  }
  return this.slice(0, this.lastIndexOf(str));
};

/**
 * Return the piece of string starting with the argument; empty string if not found.
 * 'hi.there'.substringFrom('.') => 'there'
 */
newString.substringFrom = function (str) {
  if (!this.contains(str)) {
    return '';
  }
  return this.slice(this.indexOf(str) + str.length);
};

/**
 * Return the piece from the last occurrence of the argument; empty string if not found.
 * 'hi.there.you'.substringFromLast('.') => 'you'
 */
newString.substringFromLast = function (str) {
  if (!this.contains(str)) {
    return '';
  }
  return this.slice(this.lastIndexOf(str) + str.length);
};

/**
 * Replace all occurrences of a string with the replacement.
 */
newString.replaceAll = function (find, replace) {
  if (typeof find === 'string') {
    if (!this.contains(find)) return this;
    return this.split(find).join(replace);
  }
  if (util.isRegExp(find)) {
    return this.replace(find.makeGlobal(), replace);
  }
  return this.replace(find, replace);
};

newString.replaceIgnoreCase = function (find, replace) {
  if (util.isRegExp(find)) {
    return this.replace(find.addOptions('i'), replace);
  }
  if (typeof find !== 'string') {
    return null;
  }
  if (!this.containsIgnoreCase(find)) return this;
  const newCase = new RegExp(find, 'i');
  return this.replace(newCase, replace);
};

newString.replaceAllIgnoreCase = function (find, replace) {
  if (util.isRegExp(find)) {
    return this.replace(find.addOptions('gi'), replace);
  }
  if (typeof find !== 'string') {
    return null;
  }
  if (!this.containsIgnoreCase(find)) return this;
  const newCase = new RegExp(find, 'gi');
  return this.replace(newCase, replace);
};

/**
 * Repeat the given string a few times.
 * Based on: http://stackoverflow.com/a/5450113/978796
 */
newString.repeat = function (count) {
  if (count < 1) {
    return '';
  }
  let result = '';
  let pattern = this.valueOf();
  while (count > 0) {
    if (count & 1) {
      result += pattern;
    }
    count >>= 1;
    pattern += pattern;
  }
  return result;
};

/**
 * Capitalize a string: first letter upper case, rest as is.
 */
newString.capitalize = function () {
  return this.charAt(0).toUpperCase() + this.slice(1);
};

/**
 * Pad a string with the given character.
 */
newString.pad = function (length, character) {
  character = character || ' ';
  if (length - this.length <= 0) {
    return this;
  }
  return character.repeat(length - this.length) + this;
};

/**
 * Format a string using the same convention as `util.format()`:
 * `%s` represents a string value, `%j` converts to JSON, and so on.
 */
newString.format = function () {
  const args = [this].concat(Array.prototype.slice.call(arguments, 0));
  return util.format.apply(null, args);
};

/**
 * Web safe escape. Escapes everything that escape does and the plus sign.
 */
newString.escapeForWeb = function () {
  return escape(this).replaceAll('+', '%2B').replaceAll('/', '%2F').replaceAll('*', '%2A');
};

/**
 * Unescapes everything that unescape does plus "+", and can also be applied
 * on the result more than once without generating URIError: URI malformed as decodeURIComponent does.
 */
newString.unescapeForWeb = function () {
  return unescape(this.replaceAllIgnoreCase('%2b', '+').replaceAllIgnoreCase('%2f', '/').replaceAllIgnoreCase('%2a', '*'));
};

/**
 * Implement a hash code prototype for a string.
 * Based on http://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/
 */
newString.hashCode = function () {
  let hash = 0;
  if (this.length === 0) {
    return hash;
  }
  for (let i = 0; i < this.length; i++) {
    const char = this.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash &= hash; // Convert to 32bit integer
  }
  return hash;
};

/* To Title Case © 2018 David Gouch | https://github.com/gouch/to-title-case */

// eslint-disable-next-line no-extend-native
newString.toTitleCase = function () {
  const smallWords = /^(a|an|and|as|at|but|by|en|for|if|in|nor|of|on|or|per|the|to|v.?|vs.?|via)$/i;
  const alphanumericPattern = /([A-Za-z0-9\u00C0-\u00FF])/;
  const wordSeparators = /([ :–—-])/;

  return this.toLowerCase().split(wordSeparators)
    .map((current, index, array) => {
      if (
        /* Check for small words */
        current.search(smallWords) > -1
        /* Skip first and last word */
        && index !== 0
        && index !== array.length - 1
        /* Ignore title end and subtitle start */
        && array[index - 3] !== ':'
        && array[index + 1] !== ':'
        /* Ignore small words that start a hyphenated phrase */
        && (array[index + 1] !== '-'
          || (array[index - 1] === '-' && array[index + 1] === '-'))
      ) {
        return current.toLowerCase();
      }

      /* Ignore intentional capitalization */
      if (current.substr(1).search(/[A-Z]|\../) > -1) {
        return current;
      }

      /* Ignore URLs */
      if (array[index + 1] === ':' && array[index + 2] !== '') {
        return current;
      }

      /* Capitalize the first letter */
      return current.replace(alphanumericPattern, (match) => match.toUpperCase());
    })
    .join('');
};

newString.toSentenceCase = function () {
  // let's split the string after every '.', Since every sentence ends with a dot.
  const sentences = this.toLowerCase().split('.');
  const updated = [];

  // let's map over our sentences array
  sentences.forEach((sentence) => {
    if (sentence) {
      // if the first character is not space
      if (sentence[0] !== ' ') {
        const output = sentence.charAt(0).toUpperCase() + sentence.slice(1);
        updated.push(output);
      }
      // if the first character is space
      else {
        const output = sentence.charAt(1).toUpperCase() + sentence.slice(2);
        updated.push(` ${output}`);
      }
    }
  });

  // let's join our array with ., same character we split it with.
  let final = updated.join('.');

  // if the sentence ends with ., let's add it to our final output as well.
  if (this.endsWith('.')) {
    final += '.';
  }

  return final;
};

// add new string functions to string prototype
core.addProperties(String.prototype, newString);

String.createToken = function (value) {
  value = value || `${Date.now()}${Math.random()}`;
  const hash = crypto.createHash('sha256');
  // instead of hex, return base36 which is more information-dense
  return convertBinaryToBase36(hash.update(String(value)).digest());
};

/**
 * Convert binary to base 36.
 */
function convertBinaryToBase36(binary) {
  let result = '';
  for (let i = 0; i < 25; i++) {
    var c;
    if (typeof binary === 'string') {
      c = binary.charCodeAt(i) % 36;
    } else {
      c = binary[i] % 36;
    }
    if (c < 10) {
      result += String.fromCharCode(48 + c);
    } else {
      result += String.fromCharCode(87 + c);
    }
  }
  return result;
}
