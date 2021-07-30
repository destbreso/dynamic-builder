/* eslint-disable no-underscore-dangle */
const { isEmpty, cloneJSON, projector } = require('../utils/common');
const { makeKey, tokenize, flatten } = require('./expressions/common');
const buildProjection = require('./expressions/projectionExpression');
const buildLogicCondition = require('./expressions/logicCondition');
const buildKeyCondition = require('./expressions/keyCondition');
const buildUpdateParams = require('./expressions/updateExpression');

const debug = require('@dabh/diagnostics')('aws:dynamodb:builder');

// eslint-disable-next-line no-underscore-dangle

const itemNotExistsCondition = (options) => {
  const { schema } = options.key;
  const params = {
    expression: `attribute_not_exists(#${schema.hash})`,
    attrNames: {
      [`#${schema.hash}`]: schema.hash,
    },
  };
  if (schema.sort) {
    if (!options._indexName) throw new Error('error. index name required');
    params.expression += ` and attribute_not_exists(#${schema.sort})`;
    params.attrNames[`#${schema.sort}`] = schema.sort;
  }
  return params;
};

const itemExistsCondition = (options) => {
  const { schema } = options.key;
  const params = {
    expression: `attribute_exists(#${schema.hash})`,
    attrNames: {
      [`#${schema.hash}`]: schema.hash,
    },
  };
  if (schema.sort) {
    if (!options._indexName) throw new Error('error.index name required');
    params.expression += ` and attribute_exists(#${schema.sort})`;
    params.attrNames[`#${schema.sort}`] = schema.sort;
  }
  return params;
};

function buildParamsPut(options) {
  if (!options.key.hash.exists) throw new Error('cant build params without hash key');
  if (isEmpty(options._item)) throw new Error('cant build params without item');
  if (!options._item[options.keySchema.hash]) throw new Error('cant build params. item not match with key schema (hash)');
  if (options.keySchema.sort
    && !options._item[options.keySchema.sort]) throw new Error('cant build params. item not match with key schema (sort)');

  const params = {
    TableName: options.tableName,
    Item: options._item,
  };
  if (!options._forceCreate) {
    const notExist = itemNotExistsCondition(options);
    params.ConditionExpression = notExist.expression;
    params.ExpressionAttributeNames = notExist.attrNames;
  }

  return params;
}

function buildParamsDel(options) {
  if (!options.key.hash.exists) throw new Error('cant build params without hash key');
  if (isEmpty(options.hashCondition)) throw new Error('cant build params without hash condition');
  if (options.key.sort.exists
    && (!options._indexName || isEmpty(options.sortCondition))
  ) { throw new Error('cant build params. with composed key you must define both sort name and sort condition...and index'); }

  const params = {
    TableName: options.tableName,
    Key: makeKey(options),
  };

  const exist = itemExistsCondition(options);
  params.ConditionExpression = exist.expression;
  params.ExpressionAttributeNames = exist.attrNames;

  return params;
}

function buildParamsGet(options) {
  if (!options.key.hash.exists) throw new Error('cant build params without hash key');
  if (isEmpty(options.hashCondition)) throw new Error('cant build params without hash condition');
  if (options.key.sort.exists
    && (!options._indexName || isEmpty(options.sortCondition))
  ) { throw new Error('cant build params. with composed key you must define both sort name and sort condition...and index'); }

  const params = {
    TableName: options.tableName,
    Key: makeKey(options),
    ConsistentRead: options._consistentRead,
  };

  const projParams = buildProjection(options);
  params.ProjectionExpression = projParams.expression;
  params.ExpressionAttributeNames = projParams.attrNames;

  return params;
}

function buildParamsUpdate(options) {
  if (!options.key.hash.exists) throw new Error('cant build params without hash key');
  if (isEmpty(options.hashCondition)) throw new Error('cant build params without hash condition');
  if (options.key.sort.exists
    && (!options._indexName || isEmpty(options.sortCondition))
  ) { throw new Error('cant build params. with composed key you must define both sort name and sort condition...and index'); }

  const updtConditions = buildLogicCondition(options);
  const updtParams = buildUpdateParams(options);
  const exist = itemExistsCondition(options);

  const params = {
    TableName: options.tableName,
    Key: makeKey(options),
    UpdateExpression: updtParams.expression,
    ConditionExpression: updtConditions.expression,
    ExpressionAttributeNames: {
      ...updtConditions.attrNames,
      ...updtParams.attrNames,
      ...exist.attrNames,
    },
    ExpressionAttributeValues: {
      ...updtConditions.attrValues,
      ...updtParams.attrValues,
    },
  };

  if (!isEmpty(params.ConditionExpression)) params.ConditionExpression = `${exist.expression} and (${params.ConditionExpression})`;
  else params.ConditionExpression = exist.expression;

  if (isEmpty(params.UpdateExpression)) delete params.UpdateExpression;
  if (isEmpty(params.ExpressionAttributeNames)) delete params.ExpressionAttributeNames;
  if (isEmpty(params.ExpressionAttributeValues)) delete params.ExpressionAttributeValues;

  return params;
}

function buildParamsScan(options) {
  // here some specific method checks
  const filterParams = buildLogicCondition(options);
  const projParams = buildProjection(options);

  // console.log('====[buildParamsQuery: buildConditions -> params]');
  // console.log(params);

  const params = {
    TableName: options.tableName,
    IndexName: options.indexName,
    Limit: options.limit,
    FilterExpression: filterParams.expression,
    ProjectionExpression: projParams.expression,
    ExpressionAttributeNames: {
      ...filterParams.attrNames,
      ...projParams.attrNames,
    },
    ExpressionAttributeValues: filterParams.attrValues,
  };

  if (isEmpty(params.ExpressionAttributeNames)) delete params.ExpressionAttributeNames;
  if (isEmpty(params.ExpressionAttributeValues)) delete params.ExpressionAttributeValues;

  return params;
}

function buildParamsQuery(options) {
  if (!options.key.hash.exists
    || isEmpty(options.hashCondition)) throw new Error('cant build params. you need to especify at least a hash key condition');
  if (options.key.sort.exists
      && (!options._indexName)
  ) { throw new Error('cant build params. with composed key you must define table index'); }

  const filterParams = buildLogicCondition(options);
  const keyCondParams = buildKeyCondition(options);
  const projParams = buildProjection(options);

  // console.log('====[buildParamsQuery: buildConditions -> params]');
  // console.log(params);

  const params = {
    TableName: options.tableName,
    IndexName: options.indexName,
    Limit: options.limit,
    ConsistentRead: options._consistentRead,
    KeyConditionExpression: keyCondParams.expression,
    FilterExpression: filterParams.expression,
    ProjectionExpression: projParams.expression,
    ExpressionAttributeNames: {
      ...keyCondParams.attrNames,
      ...filterParams.attrNames,
      ...projParams.attrNames,
    },
    ExpressionAttributeValues: {
      ...keyCondParams.attrValues,
      ...filterParams.attrValues,
    },
  };
  if (isEmpty(params.ExpressionAttributeNames)) delete params.ExpressionAttributeNames;
  if (isEmpty(params.ExpressionAttributeValues)) delete params.ExpressionAttributeValues;

  return params;
}

function buildParams(options) {
  // options.show(10);

  let params;
  switch (options.method) {
    case 'put':
      params = buildParamsPut(options);
      break;
    case 'del':
      params = buildParamsDel(options);
      break;
    case 'get':
      params = buildParamsGet(options);
      break;
    case 'update':
      params = buildParamsUpdate(options);
      break;
    case 'query':
      params = buildParamsQuery(options);
      break;
    case 'scan':
      params = buildParamsScan(options);
      break;
    default:
      throw new Error(`unsuported method ${options.method}`);
  }
  // console.log('====[final params]');
  // console.log(params);
  return params;
}

// const projectItem = (item, projection) => {
//   const result = cloneJSON(item);
//   if (projection.length > 0) {
//     Object.keys(item).map((key) => {
//       if (!projection.find((x) => x === key)) delete result[key];
//     });
//   }
//   return result;
// };

module.exports = {
  buildParams,
  flatten,
  tokenize,
  projectItem: (item, projection) => projector(projection)(item),
};
