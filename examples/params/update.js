const DDBBuilder = require('../../index');

const dbBuilder = new DDBBuilder('mi tabla');

console.log('===> * simple key');
let params = dbBuilder
  .key.hash.name('hasName')
  .key.hash.condition.eq('hashValue')
  .set({
    client: { age: 50 },
    name: 'david',
  })
  .add({
    economic: { seats: 10 },
    'fist_class.seats': -3,
  })
  .condition('fist_class.seats')
  .ge(0)
  .update('count')
  .add(-2)
  .show(4)
  .build('update', true);

// console.log('===> * composed key');
// params = dbBuilder
//   .index('indexName')
//   .key.hash.name('hasName')
//   .key.hash.condition.eq('hashValue')
//   .key.sort.name('sortName')
//   .key.sort.condition.beginsWith('somePrefix')
//   .show(4)
//   .build('query', true);

// console.log('===> * with projections and consistentRead');
// params = dbBuilder
//   .key.hash.name('hasName')
//   .key.hash.condition.eq('hashValue')
//   .project('field1')
//   .project(['field2', 'composed.field', 'more.deep.property'])
//   .forceRead() // consistent read
//   .show(4)
//   .build('query', true);

// console.log('===> * with filters and limit');
// params = dbBuilder
//   .index('indexName')
//   .key.hash.name('hasName')
//   .key.hash.condition.eq('hashValue')
//   .key.sort.name('sortName')
//   .key.sort.condition.beginsWith('somePrefix')
//   .mustGE({ stringField: 'stringValue', 'some.nested.numeric.field': 40 })
//   .mustLT({ 'numeric.field': 20 })
//   .mustEQ({ 'some.other.string': 'cool ahh' })
//   .mustBeginsWith({ 'string.field.youknown': 'some prefix...' })
//   .mustEQ({ hasName: 'otherHashNAme' }) // this must be ignored in building step
//   .setLimit(10)
//   .show(4)
//   .build('query', true);

// console.log('===> * with complex filters');
// params = dbBuilder
//   .index('indexName')
//   .key.hash.name('hasName')
//   .key.hash.condition.eq('hashValue')
//   .key.sort.name('sortName')
//   .key.sort.condition.beginsWith('somePrefix')
//   .must({
//     ge: { stringField: 'stringValue', 'some.nested.numeric.field': 40 },
//     lt: { 'numeric.field': 20 },
//     eq: { 'some.other.string': 'cool ahh' },
//   })
//   .mustBeginsWith({ 'string.field.youknown': 'some prefix...' })
//   .setLimit(10)
//   .show(4)
//   .build('query', true);

console.log('===> * more than one field value fora a field');
params = dbBuilder
  .key.hash.name('id')
  .key.hash.condition.eq('este es el id')
  .project(['id', 'enabled'])
  .enableUpdate(['item.enabled'])
  .set({ 'item.enabled': !!false })
  .enableUpdate('disabledBy')
  .mustEQ({ 'item.enabled': true })
  .set({ disabledBy: 'user' })
  .show(4)
  .build('update', true);
