/* eslint-disable no-underscore-dangle */
const _operatorType = {
  nq: 'comparator',
  eq: 'comparator',
  gt: 'comparator',
  ge: 'comparator',
  lt: 'comparator',
  le: 'comparator',
  //-----------------------------
  between: 'condition',
  // in: 'condition',
  // and: 'condition',
  // or: 'condition',
  // not: 'condition',
  //-----------------------------
  attribute_exists: 'funct',
  attribute_not_exists: 'funct',
  attribute_type: 'funct',
  begins_with: 'funct',
};

const _expressionMaker = {
  comparator: {
    nq: (name, value) => `${name} <> ${value}`,
    eq: (name, value) => `${name} = ${value}`,
    gt: (name, value) => `${name} > ${value}`,
    ge: (name, value) => `${name} >= ${value}`,
    lt: (name, value) => `${name} < ${value}`,
    le: (name, value) => `${name} <= ${value}`,
  },
  condition: {
    between: (name, values) => `${name} BETWEEN ${values[0]} AND ${values[1]}`,
  },
  funct: {
    attribute_exists: (path) => `attribute_exists(${path})`,
    attribute_not_exists: (path) => `attribute_not_exists(${path})`,
    begins_with: (path, sustr) => `begins_with(${path},${sustr})`,
    // attribute_type: (path, type) => `attribute_type(${path},${type})`, // type S|SS|N|NS|B|BS|BOOL|NULL|L
    // contains: (path,operand) =>   `contains(${path})`
    // size: (path) => ``
  },
};

const exprTokenGenerator = (operator) => {
  if (typeof operator !== 'string') throw new Error('operator must to be string type');
  const opClass = _operatorType[operator];
  if (!opClass) throw new Error(`unsuported operator '${operator}'`);
  return (name, value) => _expressionMaker[opClass][operator](name, value);
};

module.exports = {
  exprTokenGenerator,
};
