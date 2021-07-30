
const DDBBuilder = require('../../index');

const dbBuilder = new DDBBuilder('mi tabla');

console.log('===> * simple key');
let params = dbBuilder
  .key.hash.name('hasName')
  .show(4)
  .build('put', true);

console.log('===> * composed key');
params = dbBuilder
  .index('indexName')
  .key.hash.name('hasName')
  .key.sort.name('sortName')
  .show(4)
  .build('put', true);

console.log('===> * forcing creation');
params = dbBuilder
  .index('indexName')
  .key.hash.name('hasName')
  .key.sort.name('sortName')
  .forceCreate()
  .show(4)
  .build('put', true);
