const { isEmpty, arrayDiff } = require('../../utils/common');
const { tokenize } = require('./common');

const debug = require('@dabh/diagnostics')('aws:dynamodb:builder');
const debugVerbose = require('@dabh/diagnostics')('aws:dynamodb:builder:verbose');

const UPDATERS_DICC = {
  set: 'set',
  add: 'add',
  // remove: 'remove',
  // delete: 'delete',
};

const UPDATERS = {
  set: (field, value) => `${field} = ${value}`, // set
  add: (field, value) => `${field} ${value}`, // add
};

const exprTokenGenerator = (updater) => (field, value) => {
  if (!UPDATERS[updater]) throw new Error(` -- updater ${updater} not supported`);
  return UPDATERS[updater](field, value);
};

const buildToken = (tokenExpansion, updater) => {
  const operatorName = Object.keys(updater)[0];
  if (!UPDATERS[operatorName]) throw new Error(` -- updater ${operatorName} not supported`);

  const fieldName = Object.keys(tokenExpansion)[0];
  const name = tokenExpansion[fieldName].nameInExpression;
  const value = tokenExpansion[fieldName].valueInExpression;

  const tokenGenerator = exprTokenGenerator(operatorName);
  const expr = tokenGenerator(name, value);

  const exprToken = {
    attrNames: tokenExpansion[fieldName].attrNames,
    attrValues: { [value]: updater[operatorName][fieldName] },
    expression: expr,
  };

  return exprToken;
};

const buildUpdaterParam = (updater) => {
  if (!UPDATERS_DICC[updater]) throw new Error(` -- updater ${updater} not supported`);
  const pathUpdateable = (field, attrList) => attrList.find((attr) => {
    const parsedAttr = attr.split('*')[0];
    const goDeep = (attr.split('*')[1] === '');

    const result = goDeep
      ? field.startsWith(parsedAttr) : parsedAttr === field;

    // console.log(' - parsedAttr', parsedAttr);
    // console.log(' - goDeep', goDeep);
    // console.log(` path ${field} is updateable`, result);
    return result;
  });
  return (options, data, attributeList) => {
    const params = {
      expression: '',
      attrNames: {},
      attrValues: {},
    };
    Object.keys(data).forEach((field) => {
      if (isEmpty(attributeList) || pathUpdateable(field, attributeList)) {
        const pathAlias = options._incrFieldCount(field);

        const tokenExpansion = tokenize([field], pathAlias);
        const exprToken = buildToken(tokenExpansion, { [updater]: { [field]: data[field] } });
        if (!isEmpty(params.expression)) params.expression += ', ';
        params.expression += exprToken.expression;
        params.attrNames = {
          ...params.attrNames,
          ...exprToken.attrNames,
        };
        params.attrValues = {
          ...params.attrValues,
          ...exprToken.attrValues,
        };
      }
    });
    if (!isEmpty(params.expression)) params.expression = `${updater} ${params.expression}`;
    return params;
  };
};

const buildSetParam = buildUpdaterParam('set');
const buildAddParam = buildUpdaterParam('add');

const build = (options) => {
  debugVerbose('build', options);

  const { _update } = options;
  const ignoreList = [...new Set(_update.blacklist.concat(options.keys))];
  const admiteList = arrayDiff(_update.whitelist, _update.blacklist);
  const { updaters } = _update;

  debugVerbose('ignoreList', ignoreList);
  debugVerbose('admiteList', admiteList);
  debugVerbose('updaters', updaters);

  const setParams = buildSetParam(options, updaters.set, admiteList);
  const addParams = buildAddParam(options, updaters.add, admiteList);

  const params = {
    expression: '',
    attrNames: {},
    attrValues: {},
  };

  const paramList = [setParams, addParams];

  paramList.forEach((param) => {
    if (!isEmpty(param.expression)) {
      if (!isEmpty(params.expression)) params.expression += ' '; // ???
      params.expression += param.expression;
      params.attrNames = {
        ...params.attrNames,
        ...param.attrNames,
      };
      params.attrValues = {
        ...params.attrValues,
        ...param.attrValues,
      };
    }
  });

  if (isEmpty(params.expression)) delete params.expression;
  if (isEmpty(params.attrNames)) delete params.attrNames;
  if (isEmpty(params.attrValues)) delete params.attrValues;

  return params;
};

module.exports = build;
