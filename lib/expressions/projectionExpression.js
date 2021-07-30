const { isEmpty } = require('../../utils/common');
const { tokenize } = require('./common');

const debug = require('@dabh/diagnostics')('aws:dynamodb:builder:verbose');

const build = (options) => {
  debug(' -- buildProjection', options);
  const projAttributes = options.projection;

  if (isEmpty(projAttributes)) return {};

  const attrTokens = tokenize(projAttributes);

  const params = {
    expression: '',
    attrNames: {},
  };

  Object.keys(attrTokens).forEach((attr) => {
    if (params.expression !== '') params.expression += ', ';
    params.attrNames = {
      ...params.attrNames,
      ...attrTokens[attr].attrNames,
    };
    params.expression += attrTokens[attr].nameInExpression;
  });

  if (isEmpty(params.attrNames)) delete params.attrNames;
  if (isEmpty(params.expression)) delete params.expression;

  return params;
};

module.exports = build;
