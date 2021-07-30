/* eslint-disable no-underscore-dangle */
const { isEmpty, isObject } = require('../../utils/common');

const debug = require('@dabh/diagnostics')('aws:dynamodb:builder:verbose');

const makeKey = (options) => {
  // console.log('*************************');
  // console.log(options);
  // console.log('*************************');
  const key = {};
  const { schema } = options.key;
  const hashName = schema.hash;
  const sortName = schema.sort;

  const hashValue = options._filter.keyConditions.hash[hashName].eq;
  if (!hashName || !hashValue) throw new Error('error creating key. expected hash key');
  key[hashName] = hashValue;

  if (sortName) {
    if (!options._indexName) throw new Error('error creating key. index name required');
    const sortValue = options._filter.keyConditions.sort[sortName].eq;
    if (sortName && !sortValue) throw new Error('error creating key.corrupt sort key');
    key[sortName] = sortValue;
  }

  return key;
};

const tokenize = (fieldList = [], fieldAlias = 0) => {
  debug('tokenize: ', fieldList);
  if (!Array.isArray(fieldList)) throw new Error('invalid format: fieldList as array');
  if (isEmpty(fieldList)) throw new Error('invalid format: fieldList cant be empty');

  const tokens = {};

  fieldList.forEach((field) => {
    if (typeof field !== 'string') throw new Error('invalid format: field must be an string');
    const valueAlias = fieldAlias > 0 ? `${fieldAlias}` : '';
    tokens[field] = {
      // tokens: {},
      nameInExpression: `#${field.replace(/\./g, '.#')}`,
      valueInExpression: `:${field.replace(/\./g, '')}${valueAlias}`,
      attrNames: {},
    };
    field.split('.').forEach((tk) => {
      // tokens[field].tokens[`#${tk}`] = `:${tk}`;
      tokens[field].attrNames[`#${tk}`] = tk;
    });
  });
  return tokens;
};

const flatten = (obj) => {
  // eslint-disable-next-line no-underscore-dangle
  const _flatten = (params, baseKey, flatObj) => {
    baseKey = baseKey || '';
    flatObj = flatObj || {};

    Object.keys(params).map((key) => {
      const flatField = baseKey !== '' ? `${baseKey}.${key}` : key;
      const value = params[key];
      if (isObject(value)) {
        return _flatten(value, flatField, flatObj);
      }
      flatObj[flatField] = value;
    });
  };
  const result = {};
  _flatten(obj, '', result);
  return result;
};

module.exports = {
  makeKey,
  tokenize,
  flatten,
};
