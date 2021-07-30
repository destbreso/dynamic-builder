/* eslint-disable no-underscore-dangle */
const DynamoBuilder = require('../../index');

describe('#builder', () => {
  describe('params-del', () => {
    const builder = new DynamoBuilder('table name');

    it('simple key', async () => {
      const params = builder
        .key.hash.name('hashName')
        .key.hash.condition.eq('hashValue')
        .build('del');

      expect(params).toEqual({
        TableName: 'table name',
        Key: { hashName: 'hashValue' },
        ConditionExpression: 'attribute_exists(#hashName)',
        ExpressionAttributeNames: { '#hashName': 'hashName' },
      });
    });

    it('composed key', async () => {
      const params = builder
        .index('indexName')
        .key.hash.name('hashName')
        .key.sort.name('sortName')
        .key.hash.condition.eq('hashValue')
        .key.sort.condition.eq('sortValue')
        .build('del');

      expect(params).toEqual({
        TableName: 'table name',
        Key: { hashName: 'hashValue', sortName: 'sortValue' },
        ConditionExpression: 'attribute_exists(#hashName) and attribute_exists(#sortName)',
        ExpressionAttributeNames: { '#hashName': 'hashName', '#sortName': 'sortName' },
      });
    });
  });
});
