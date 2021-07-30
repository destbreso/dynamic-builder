/* eslint-disable no-underscore-dangle */

const { isEmpty } = require('../../utils/common');
const { tokenize } = require('./common');
const { exprTokenGenerator } = require('./operators');

const debug = require('@dabh/diagnostics')('aws:dynamodb:builder');
const debugVerbose = require('@dabh/diagnostics')('aws:dynamodb:builder:verbose');

const buildToken = (tokenExpansion, condition) => {
  debugVerbose('building token', tokenExpansion, 'cond', condition);
  const fieldName = Object.keys(tokenExpansion)[0];

  const exprToken = {
    attrNames: {},
    attrValues: {},
    expression: '',
  };

  Object.keys(condition).forEach((operatorName, index) => {
    const name = tokenExpansion[fieldName].nameInExpression;
    const value = `${tokenExpansion[fieldName].valueInExpression}${index}`;

    const conditionValues = Array.isArray(condition[operatorName])
      ? condition[operatorName]
      : [condition[operatorName]];

    let subValues = [];
    conditionValues.forEach((condVal, index2) => {
      const subValue = `${value}${index2}`;
      subValues.push(subValue);

      exprToken.attrNames = {
        ...exprToken.attrNames,
        ...tokenExpansion[fieldName].attrNames,
      };
      exprToken.attrValues = {
        ...exprToken.attrValues,
        [subValue]: condVal,
      };
    });
    subValues = subValues.length === 1 ? subValues[0] : subValues;
    const tokenGenerator = exprTokenGenerator(operatorName);
    const expr = tokenGenerator(name, subValues);

    exprToken.expression = isEmpty(exprToken.expression) ? expr : `${exprToken.expression} and ${expr}`; // ToDO: extend for OR composition
  });

  // console.log(' ==> exprToken', exprToken);

  return exprToken;
};

const build = (options) => {
  const { keyConditions } = options._filter;
  debugVerbose('build keyConditions', keyConditions);

  const condition = {
    expression: '',
    attrNames: {},
    attrValues: {},
  };

  if (!isEmpty(keyConditions.hash)) {
    if (!options.key.hash.exists) throw new Error('hash key is mandatory');
    const hashField = Object.keys(keyConditions.hash)[0];
    const hashTokenExpansion = tokenize([hashField]);
    const hashExprToken = buildToken(hashTokenExpansion, keyConditions.hash[hashField]);

    condition.expression = `${hashExprToken.expression}`;
    condition.attrNames = hashExprToken.attrNames;
    condition.attrValues = hashExprToken.attrValues;

    if (options.haveSortKey && !isEmpty(keyConditions.sort)) {
      const sortField = Object.keys(keyConditions.sort)[0]; // sort key is unique
      const sortTokenExpansion = tokenize([sortField]);
      const sortExprToken = buildToken(sortTokenExpansion, keyConditions.sort[sortField]);

      if (!isEmpty(sortExprToken.expression)) {
        condition.expression += ` and ${sortExprToken.expression}`;
        condition.attrNames = {
          ...condition.attrNames,
          ...sortExprToken.attrNames,
        };
        condition.attrValues = {
          ...condition.attrValues,
          ...sortExprToken.attrValues,
        };
      }
    }
  }

  if (isEmpty(condition.expression)) delete condition.expression;
  if (isEmpty(condition.attrNames)) delete condition.attrNames;
  if (isEmpty(condition.attrValues)) delete condition.attrValues;

  return condition;
};

module.exports = build;
