/* eslint-disable no-underscore-dangle */
const { inspect } = require('util');
const { exprTokenGenerator } = require('./operators');
const { tokenize } = require('./common');
const { cloneJSON } = require('../../utils/common');

const buildToken = (condObj, fieldAlias = 0) => {
  let { op, path, values } = condObj;
  // console.log(` -- building token: path ${path}, alias: ${fieldAlias}`);

  if (op === 'attribute_exists' || op === 'attribute_not_exists') {
    values = undefined;
  }

  const tokenExpansion = tokenize([path], fieldAlias);

  const name = tokenExpansion[path].nameInExpression;
  const value = tokenExpansion[path].valueInExpression;

  const tokenGenerator = exprTokenGenerator(op);
  const expr = tokenGenerator(name, value);

  const exprToken = {
    attrNames: tokenExpansion[path].attrNames,
    expression: expr,
  };
  if (values) {
    exprToken.attrValues = { [value]: values };// TODO: manage multiple values (pe. between)
  }

  return exprToken;
};

class Condition {
  constructor(op, path, values, parent = null) {
    if (!path || !values || !op) throw new Error('path, values, op are mandatory');
    this._parent = parent;
    this._ctx = [{ path, values, op }];
    this._ctxOp = null;
    this._nestedCtx = null;
    this._nestedCtxOp = null;
    // this._not = !notNegate;
    this._pathCounters = { [path]: 0 };
    this._pathCounters = this._incCounter(path);
    this._exprToken = buildToken(this._ctx[0], this._pathCounters[path]);
  }

  _incCounter(pathName) {
    this._pathCounters = this._parent ? cloneJSON(this._parent._pathCounters) : this._pathCounters;

    this._pathCounters[pathName] = this._pathCounters[pathName]
      ? this._pathCounters[pathName] + 1
      : 1;
    return this._pathCounters;
  }

  show(depth = 0, label = '') {
    console.log(`${label}: ${inspect(this, { depth, colors: true })}`);
    return this;
  }

  get next() {
    return this._nestedCtx;
  }

  _updtExpression(obj, op) {
    this._incCounter(obj.path);
    const newToken = buildToken(obj, this._pathCounters[obj.path]);
    if (this._exprToken.expression !== '') this._exprToken.expression += ` ${op} `;
    this._exprToken.expression += newToken.expression;
    this._exprToken.attrNames = {
      ...this._exprToken.attrNames,
      ...newToken.attrNames,
    };
    this._exprToken.attrValues = {
      ...this._exprToken.attrValues,
      ...newToken.attrValues,
    };
  }

  and(op, path, values) {
    const token = { path, values, op };
    if (this._parent && this._ctx.length === 0) {
      this._ctx.push(token);
      this._updtExpression(token, 'AND');
      return this;
    }
    if ((!this._ctxOp || this._ctxOp === 'AND')) {
      this._ctx.push(token);
      this._updtExpression(token, 'AND');
      this._ctxOp = 'AND';
      return this;
    }
    if (!this._nestedCtx) {
      this._nestedCtx = new Condition(op, path, values, this);
      this._incCounter(path);
      this._nestedCtxOp = 'AND';
    } else {
      this._nestedCtx._ctx.push(token);
      this._updtExpression(token, 'AND');
    }
    return this._nestedCtx;
  }

  or(op, path, values) {
    const token = { path, values, op };
    if (this._parent && this._ctx.length === 0) {
      this._ctx.push(token);
      this._updtExpression(token, 'OR');
      return this;
    }
    if ((!this._ctxOp || this._ctxOp === 'OR')) {
      this._ctx.push(token);
      this._updtExpression(token, 'OR');
      this._ctxOp = 'OR';
      return this;
    }

    if (!this._nestedCtx) {
      this._nestedCtx = new Condition(op, path, values, this);
      this._incCounter(path);
      this._nestedCtxOp = 'OR';
    } else {
      this._nestedCtx._ctx.push(token);
      this._updtExpression(token, 'OR');
    }
    return this._nestedCtx;
  }

  parse() {
    function goTrhough(cond) {
      // console.log('******* [goTrhough] *******');
      // console.log('baseExpr:', baseExpr);
      // console.log('condExpr:', cond._expression);
      // console.log('op in ctx:', cond._ctxOp);
      // console.log('op w/ nested:', cond._nestedCtxOp);

      const currentExprToken = cloneJSON(cond._exprToken);
      if (!cond._nestedCtx) return currentExprToken;
      const nestedExprToken = goTrhough(cond._nestedCtx);
      return {
        expression: `(${currentExprToken.expression}) ${cond._nestedCtxOp} (${nestedExprToken.expression})`,
        attrNames: {
          ...currentExprToken.attrNames,
          ...nestedExprToken.attrNames,
        },
        attrValues: {
          ...currentExprToken.attrValues,
          ...nestedExprToken.attrValues,
        },
      };
    }

    const expr = goTrhough(this);
    return expr;
  }
}

module.exports = Condition;
