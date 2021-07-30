const DDBBuilder = require('../../index');

const dbBuilder = new DDBBuilder('mi tabla');

console.log('===> * simple key');
let params = dbBuilder
  .key.hash.name('hasName')
  .key.hash.condition.eq('hashValue')
  .show(4)
  .build('query', true);

console.log('===> * composed key');
params = dbBuilder
  .index('indexName')
  .key.hash.name('hasName')
  .key.hash.condition.eq('hashValue')
  .key.sort.name('sortName')
  .key.sort.condition.beginsWith('somePrefix')
  .show(4)
  .build('query', true);

console.log('===> * with projections and consistentRead');
params = dbBuilder
  .key.hash.name('hasName')
  .key.hash.condition.eq('hashValue')
  .project('field1')
  .project(['field2', 'composed.field', 'more.deep.property'])
  .forceRead() // consistent read
  .show(4)
  .build('query', true);

console.log('===> * with filters and limit');
params = dbBuilder
  .index('indexName')
  .key.hash.name('hasName')
  .key.hash.condition.eq('hashValue')
  .key.sort.name('sortName')
  .key.sort.condition.beginsWith('somePrefix')
  .mustGE({ stringField: 'stringValue', 'some.nested.numeric.field': 40 })
  .mustLT({ 'numeric.field': 20, 'some.nested.numeric.field': 100 })
  .mustEQ({ 'some.other.string': 'cool ahh' })
  .mustBeginsWith({ 'string.field.youknown': 'some prefix...' })
  .mustEQ({ hasName: 'otherHashNAme' }) // this must be ignored in building step
  .mustNQ({ f1: 'lalala', n1: 3, hashName: 'forbbiden hash name' })
  .setLimit(10)
  .show(4)
  .build('query', true);

console.log('===> * with complex filters');
params = dbBuilder
  .index('indexName')
  .key.hash.name('hasName')
  .key.hash.condition.eq('hashValue')
  .key.sort.name('sortName')
  .key.sort.condition.beginsWith('somePrefix')
  .must({
    ge: { stringField: 'stringValue', 'some.nested.numeric.field': 40 },
    lt: { 'numeric.field': 20 },
    eq: { 'some.other.string': 'cool ahh' },
  })
  .mustBeginsWith({ 'string.field.youknown': 'some prefix...' })
  .setLimit(10)
  .show(4)
  .build('query', true);
