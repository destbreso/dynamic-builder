/* eslint-disable no-unused-expressions */
/* eslint-disable no-underscore-dangle */
const { inspect } = require('util');
const utils = require('./utils');
const { isEmpty, arrayDiff } = require('../utils/common');

const debug = require('@dabh/diagnostics')('aws:dynamodb:builder');
const debugVerbose = require('@dabh/diagnostics')('aws:dynamodb:builder:verbose');

/** Filter expressions
       * eq: =
       * gt: >
       * ge: >=
       * lt: <
       * le: <=
       * attribute_exists()
       * attribute_not_exists()
       * attribute_type()
       * begins_with()
       * contains()
       * size()
       */
const CONDITIONS = {
  eq: '=',
  gt: '>',
  ge: '>=',
  lt: '<',
  le: '<=',
  nq: '<>',
};

const setCondition = (cond) => (obj, field, value) => {
  debugVerbose(`setCondition: ${cond}, field: ${field}, value: ${value}`);
  debugVerbose('  -- current obj: ', obj);

  if (value === undefined) return obj;
  if (!field) throw new Error(`invalid params. cant especify a condition for field '${field}'`);

  if (obj[field] && obj[field][cond] !== undefined) throw new Error(`field ${field} have a duplicated condition`);
  obj[field] = {
    ...obj[field],
    [cond]: value,
  };
  return obj;
};

const setEQ = setCondition('eq');
const setGT = setCondition('gt');
const setGE = setCondition('ge');
const setLT = setCondition('lt');
const setLE = setCondition('le');
const setNQ = setCondition('nq');
const setSTARTS = setCondition('begins_with');
const setBETWEEN = setCondition('between');

const setUpdater = (updtr) => (obj, field, value) => {
  debugVerbose(`setUpdater: ${updtr}`);
  debugVerbose(`  -- field: ${field}`);
  debugVerbose(`  -- value: ${value}`);
  debugVerbose('  -- obj: ', obj);

  if (value === undefined) return obj;
  if (!field) throw new Error(`invalid params. cant especify a updater for field '${field}'`);

  if (obj[field] !== undefined) throw new Error(`field ${field} have a duplicated updater`);
  obj[updtr] = {
    ...obj[updtr],
    [field]: value,
  };
  return obj;
};

const SET = setUpdater('set');
const ADD = setUpdater('add');

const processObjectCondition = (cond) => (_this, fields) => {
  if (isEmpty(fields)) return;
  if (typeof fields !== 'object') throw new Error('invalid params');
  const condMapping = utils.flatten(fields);
  Object.keys(condMapping).forEach((field) => {
    _this.condition(field)[cond](condMapping[field]);
  });
};

const processObjectUpdater = (updtr) => (_this, fields) => {
  if (isEmpty(fields)) return;
  if (typeof fields !== 'object') throw new Error('invalid params');
  const updtrMapping = utils.flatten(fields);
  Object.keys(updtrMapping).forEach((field) => {
    _this.update(field)[updtr](updtrMapping[field]);
  });
};

class DDBBuilder {
  constructor(tableName) {
    if (!tableName) throw new Error('param error: table name is mandatory');
    this._init(tableName);
  }

  _init(table) {
    this._tableName = table;
    this._indexName = undefined;
    this._keySchema = { hash: undefined, sort: undefined };
    this._projection = {
      whitelist: [],
      blacklist: [],
    };
    this._fieldCount = {};
    this._filter = {
      whitelist: [],
      blacklist: [],
      conditions: {},
      keyConditions: {
        sort: {}, //
        hash: {}, // eq
      },
    };
    this._update = {
      whitelist: [],
      blacklist: [],
      noOverwriteList: [],
      updaters: {
        set: {},
        add: {},
        remove: {},
        delete: {},
      },
    };
    this._method = undefined; // put, get, update, scan, query,
    this._consistentRead = false; // get,scan,query
    this._forceCreate = false; // put
    this._limit = undefined; // scan,query
    this._item = undefined; // put
    this.setAttr = [];
  }

  _clean() { this._init(this._tableName); }

  // =====[ getters ]=====
  /**
   * get table name
   */
  get tableName() { return this._tableName; }

  /**
   * get table index name
   */
  get indexName() { return this._indexName; }

  /**
   * get key schema. same as key.schema
   */
  get keySchema() { return this._keySchema; }

  /**
   * get hash condition
   */
  get hashCondition() { return this._filter.keyConditions.hash; }

  /**
   * get sort condition
   */
  get sortCondition() { return this._filter.keyConditions.sort; }

  /**
   * get projection attributes
   */
  get projection() {
    let projAttributes = arrayDiff(
      this._projection.whitelist,
      this._projection.blacklist,
    );
    projAttributes = [...new Set(projAttributes)];
    return projAttributes;
  }

  get method() { return this._method; }

  get limit() { return this._limit; }

  /**
   * set method (put,get,del,update,query,scan), needed for final building
   * @param {*} method
   */
  set method(method) {
    this._method = method;
    return this;
  }

  /**
   * set index name
   * @param {*} indexName
   */
  index(indexName) {
    this._indexName = indexName;
    return this;
  }

  get haveSortKey() { return this._keySchema.sort !== undefined; }

  /**
   * key configuration
   */
  get key() {
    const _this = this; // trick for keep 'this' visible in nested getters like 'exists'
    return {
      /**
       * get key names in a string array
       */
      get names() { return Object.keys(_this._keySchema).map((k) => _this._keySchema[k]); },
      /**
      * get key schema. same as keySchema
      */
      get schema() { return _this._keySchema; },
      hash: {
        /**
         * return true if sort key is defined in schema
         */
        get exists() { return _this._keySchema.hash !== undefined; },
        /**
         * set hash name in key schema
         */
        name: (name) => {
          if (this.key.hash.exists) throw new Error('hask key is already defined');
          this._keySchema.hash = name;
          this._filter.blacklist.push(name);
          return this;
        },
        condition: {
          /**
         * set equality condition over hash key
         */
          eq: (value) => {
            if (!this.key.hash.exists) throw new Error('cant especify condition in a inexistent key. hash hasnt been defined');
            return this.condition(this._keySchema.hash).eq(value);
          },
        },
      },
      sort: {
        /**
         * return true if sort key is defined in schema
         */
        get exists() { return _this._keySchema.sort !== undefined; },
        /**
         * set sort name in key schema
         */
        name: (name) => {
          if (this.key.sort.exists) throw new Error('sort key is already defined');
          this._keySchema.sort = name;
          this._filter.blacklist.push(name);
          return this;
        },
        condition: {
          /**
         * set equality condition over sort key
         */
          eq: (value) => this.condition(this._keySchema.sort).eq(value),
          /**
         * set greather than condition over sort key
         */
          gt: (value) => this.condition(this._keySchema.sort).gt(value),
          /**
         * set greather than or equal condition over sort key
         */
          ge: (value) => this.condition(this._keySchema.sort).ge(value),
          /**
         * set less than condition over sort key
         */
          lt: (value) => this.condition(this._keySchema.sort).lt(value),
          /**
         * set less than or equal condition over sort key
         */
          le: (value) => this.condition(this._keySchema.sort).le(value),
          /**
         * set prefix condition over sort key
         */
          beginsWith: (value) => this.condition(this._keySchema.sort).beginsWith(value),
          /**
         * set range value condition over sort key
         */
          between: (lhvalue, rhvalue) => this.condition(this._keySchema.sort).between(lhvalue, rhvalue),
        },
      },
    };
  }

  _incrFieldCount(fieldName) {
    if (this._fieldCount[fieldName]) this._fieldCount[fieldName] += 1;
    else this._fieldCount[fieldName] = 1;
    return this._fieldCount[fieldName];
  }

  item(item) {
    this._item = item;
    return this;
  }

  forceCreate() {
    this._forceCreate = true;
    return this;
  }

  forceRead() {
    this._consistentRead = true;
    return this;
  }

  project(fields) {
    if (typeof fields === 'string') this._projection.whitelist.push(fields);
    else if (Array.isArray(fields)) this._projection.whitelist = this._projection.whitelist.concat(fields);
    else if (fields) {
      debug('invalid params', fields);
      throw new Error('invalid params');
    }
    return this;
  }

  notProject(fields) {
    if (typeof fields === 'string') this._projection.blacklist.push(fields);
    else if (Array.isArray(fields)) this._projection.blacklist = this._projection.blacklist.concat(fields);
    else if (fields) {
      debug('invalid params', fields);
      throw new Error('invalid params');
    }
    return this;
  }

  mustEQ(fields) {
    processObjectCondition('eq')(this, fields);
    return this;
  }

  mustNQ(fields) {
    processObjectCondition('nq')(this, fields);
    return this;
  }

  mustGT(fields) {
    processObjectCondition('gt')(this, fields);
    return this;
  }

  mustGE(fields) {
    processObjectCondition('ge')(this, fields);
    return this;
  }

  mustLT(fields) {
    processObjectCondition('lt')(this, fields);
    return this;
  }

  mustLE(fields) {
    processObjectCondition('le')(this, fields);
    return this;
  }

  mustBeginsWith(fields) {
    processObjectCondition('beginsWith')(this, fields);
    return this;
  }

  must(conditions) {
    if (!conditions) return this;
    Object.keys(conditions).forEach((cond) => {
      if (CONDITIONS[cond]) {
        processObjectCondition(cond)(this, conditions[cond]);
      } else throw new Error(`unsupported [must] condition ${cond}`);
    });
    return this;
  }

  enableUpdate(fields) {
    if (typeof fields === 'string') this._update.whitelist.push(fields);
    else if (Array.isArray(fields)) this._update.whitelist = this._update.whitelist.concat(fields);
    else throw new Error('invalid params');
    return this;
  }

  disableUpdate(fields) {
    if (typeof fields === 'string') this._update.blacklist.push(fields);
    else if (Array.isArray(fields)) this._update.blacklist = this._update.blacklist.concat(fields);
    else throw new Error('invalid params');
    return this;
  }

  set(fields) {
    processObjectUpdater('set')(this, fields);
    return this;
  }

  add(fields) {
    processObjectUpdater('add')(this, fields);
    return this;
  }

  setLimit(value) {
    this._limit = parseInt(value, 10);
    return this;
  }

  enableFilters(fields) {
    if (typeof fields === 'string') this._filter.whitelist.push(fields);
    else if (Array.isArray(fields)) this._filter.whitelist = this._filter.whitelist.concat(fields);
    else throw new Error('invalid params');
    return this;
  }

  disableFilter(fields) {
    if (typeof fields === 'string') this._filter.blacklist.push(fields);
    else if (Array.isArray(fields)) this._filter.blacklist = this._filter.blacklist.concat(fields);
    else throw new Error('invalid params');
    return this;
  }

  condition(field) {
    // const _this = this;
    let ctx = this._filter.conditions;
    let proceed = true;
    if (field === this._keySchema.hash) {
      ctx = this._filter.keyConditions.hash;
      proceed = isEmpty(ctx);
    } else if (field === this._keySchema.sort) {
      ctx = this._filter.keyConditions.sort;
      proceed = isEmpty(ctx);
    }

    return {
      eq: (value) => {
        proceed && setEQ(ctx, field, value);
        return this;
      },
      gt: (value) => {
        proceed && setGT(ctx, field, value);
        return this;
      },
      ge: (value) => {
        proceed && setGE(ctx, field, value);
        return this;
      },
      lt: (value) => {
        proceed && setLT(ctx, field, value);
        return this;
      },
      le: (value) => {
        proceed && setLE(ctx, field, value);
        return this;
      },
      nq: (value) => {
        proceed && setNQ(ctx, field, value);
        return this;
      },
      beginsWith: (value) => {
        proceed && setSTARTS(ctx, field, value);
        return this;
      },
      between: (lhvalue, rhvalue) => {
        proceed && setBETWEEN(ctx, field, [lhvalue, rhvalue]);
        return this;
      },
    };
  }

  update(field) {
    const ctx = this._update.updaters;
    return {
      set: (value) => {
        SET(ctx, field, value);
        return this;
      },
      add: (value) => {
        ADD(ctx, field, value);
        return this;
      },
    };
  }

  build(method) {
    this.method = method;
    debugVerbose('builderObject', inspect(this, { depth: 10, colors: true }));
    const params = utils.buildParams(this);
    debug(`params (${method})`, params);
    this._clean(); // make builder reutilizable for same
    return params;
  }

  // recipies() {
  //   return {
  //     inc(field) {

  //     },
  //   };
  // }
}

module.exports = DDBBuilder;
