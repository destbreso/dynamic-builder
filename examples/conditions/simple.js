const Condition = require('../../lib/expressions/conditionObj');

const simple = new Condition('lt', 'age', 20);
console.log('simple condition:', simple.parse());

const simplePath = new Condition('lt', 'user.age', 20);
console.log('simple path condition:', simplePath.parse());

const simpleMulti = new Condition('lt', 'user.age', 20);
simpleMulti
  .and('eq', 'user.role', 'admin')
  .and('ge', 'amount', 100);
console.log('simple path condition:', simpleMulti.parse());


const simpleMultiOnSamefield = new Condition('ge', 'user.age', 20);
simpleMultiOnSamefield
  .and('lt', 'user.age', 35)
  .and('eq', 'user.role', 'admin')
  .and('ge', 'amount', 100);
console.log('simple path condition:', simpleMultiOnSamefield.parse());
