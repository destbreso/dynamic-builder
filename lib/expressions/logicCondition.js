/* eslint-disable no-underscore-dangle */

const { isEmpty, arrayDiff } = require('../../utils/common');
const { tokenize } = require('./common');
const { exprTokenGenerator } = require('./operators');

const debug = require('@dabh/diagnostics')('aws:dynamodb:builder:verbose');

const buildToken = (tokenExpansion, condition) => {
  debug('building token', tokenExpansion, 'cond', condition);

  const fieldName = Object.keys(tokenExpansion)[0];
  const operatorName = Object.keys(condition)[0]; // TODO: make this more generic for multicondition support
  const name = tokenExpansion[fieldName].nameInExpression;
  const value = tokenExpansion[fieldName].valueInExpression;

  const tokenGenerator = exprTokenGenerator(operatorName);
  const expr = tokenGenerator(name, value);

  const exprToken = {
    attrNames: tokenExpansion[fieldName].attrNames,
    attrValues: { [value]: condition[operatorName] },
    expression: expr,
  };

  return exprToken;
};

const build = (options) => {
  debug('build logicCondition');

  const { _filter } = options;
  const ignoreList = [...new Set(_filter.blacklist.concat(options.keys))];
  const admiteList = arrayDiff(_filter.whitelist, _filter.blacklist);
  const { conditions } = _filter;

  debug('   -- ignoreList', ignoreList);
  debug('   -- admiteList', admiteList);
  debug('   -- conditions', conditions);

  const params = {
    expression: '',
    attrNames: {},
    attrValues: {},
  };

  Object.keys(conditions).forEach((field) => {
    if (!ignoreList.includes(field)) {
      const pathAlias = options._incrFieldCount(field);

      const tokenExpansion = tokenize([field], pathAlias);
      const exprToken = buildToken(tokenExpansion, conditions[field]);

      if (!isEmpty(params.expression)) {
        params.expression += ' and '; // TODO: add support for OR and  booleans expression composition
      }
      params.expression += exprToken.expression;
      params.attrNames = {
        ...params.attrNames,
        ...exprToken.attrNames,
      };
      params.attrValues = {
        ...params.attrValues,
        ...exprToken.attrValues,
      };
    } else {
      debug('   -- skiping filter:', field);
    }
  });

  if (isEmpty(params.expression)) delete params.expression;
  if (isEmpty(params.attrNames)) delete params.attrNames;
  if (isEmpty(params.attrValues)) delete params.attrValues;

  return params;
};

module.exports = build;
