const Condition = require('../../lib/expressions/conditionObj');

const condition = new Condition('attribute_exists', 'economic.seats', 1);
condition
  .and('le', 'economic.seats', 5)
  .or('attribute_exists', 'firstClass.seats', 1)
  .and('le', 'firstClass.seats', 5);

// condition.show(10, '*********CONDITION 1*********');
console.log(condition.parse());
