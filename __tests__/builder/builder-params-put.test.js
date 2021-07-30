/* eslint-disable no-underscore-dangle */
const DynamoBuilder = require('../../index');

describe('#builder', () => {
  describe('params-put', () => {
    test('mising item', async () => {
      const builder = new DynamoBuilder('table name');

      expect(() => {
        builder
          .key.hash.name('hashName')
          .build('put');
      }).toThrowError('cant build params without item');
    });

    test('wrong item (no hash)', async () => {
      const builder = new DynamoBuilder('table name');

      expect(() => {
        builder
          .key.hash.name('hashName')
          .item({ a: 'newitem' })
          .build('put');
      }).toThrowError('cant build params. item not match with key schema (hash)');
    });

    test('wrong item (no sort)', async () => {
      const builder = new DynamoBuilder('table name');

      expect(() => {
        builder
          .key.hash.name('id')
          .key.sort.name('date')
          .item({ id: 'newitem' })
          .build('put');
      }).toThrowError('cant build params. item not match with key schema (sort)');
    });

    test('simple key', async () => {
      const builder = new DynamoBuilder('table name');

      builder._clean();

      const params = builder
        .key.hash.name('id')
        .item({ id: 'newitem' })
        .build('put', true);

      expect(params).toEqual({
        TableName: 'table name',
        Item: { id: 'newitem' },
        ConditionExpression: 'attribute_not_exists(#id)',
        ExpressionAttributeNames: { '#id': 'id' },
      });
    });

    test('composed key', async () => {
      const builder = new DynamoBuilder('table name');

      const params = builder
        .index('indexName')
        .key.hash.name('id')
        .key.sort.name('date')
        .item({ id: 'newitem', date: '2021-01-01' })
        .build('put', true);

      expect(params).toEqual({
        TableName: 'table name',
        Item: { id: 'newitem', date: '2021-01-01' },
        ConditionExpression: 'attribute_not_exists(#id) and attribute_not_exists(#date)',
        ExpressionAttributeNames: { '#id': 'id', '#date': 'date' },
      });
    });

    test('forcing creation (overwrite mode)', async () => {
      const builder = new DynamoBuilder('table name');

      const params = builder
        .index('indexName')
        .key.hash.name('hashName')
        .key.sort.name('sortName')
        .item({ hashName: 'newitem', sortName: '2021-01-01' })
        .forceCreate()
        .build('put');

      expect(params).toEqual({
        TableName: 'table name',
        Item: { hashName: 'newitem', sortName: '2021-01-01' },
      });
    });
  });
});
