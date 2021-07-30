
const { lastEventId } = require('@sentry/node');
const DDBBuilder = require('../../index');

const dbBuilder = new DDBBuilder('mi tabla');

console.log('===> * simple key');
let params = dbBuilder
  .key.hash.name('hashName')
  .key.hash.condition.eq('hashValue')
  .show(4)
  .build('get', true);

console.log('===> * composed key');
params = dbBuilder
  .index('indexName')
  .key.hash.name('hashName')
  .key.sort.name('sortName')
  .key.hash.condition.eq('hashValue')
  .key.sort.condition.eq('sortValue')
  .show(4)
  .build('get', true);

console.log('===> * with projection');
params = dbBuilder
  .key.hash.name('hashName')
  .key.hash.condition.eq('hashValue')
  .project('field1')
  .project(['field2', 'composed.field', 'more.deep.property'])
  .show(4)
  .build('get', true);
