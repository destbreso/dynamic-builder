/* eslint-disable no-underscore-dangle */
const DynamoBuilder = require('../../index');

describe('#builder', () => {
  describe('instance initialize', () => {
    // const builder = new DynamoBuilder('table name');

    it('bad construction: no tablename', async () => {
      expect(() => {
        const b = new DynamoBuilder();
      }).toThrowError('param error: table name is mandatory');
    });

    test('initialization', () => {
      const builder = new DynamoBuilder('table name');

      expect(builder).toEqual({
        _tableName: 'table name',
        _indexName: undefined,
        _keySchema: { hash: undefined, sort: undefined },
        _projection: { whitelist: [], blacklist: [] },
        _fieldCount: {},
        _filter: {
          whitelist: [],
          blacklist: [],
          conditions: {},
          keyConditions: { sort: {}, hash: {} },
        },
        _update: {
          whitelist: [],
          blacklist: [],
          noOverwriteList: [],
          updaters: {
            set: {}, add: {}, remove: {}, delete: {},
          },
        },
        _method: undefined,
        _consistentRead: false,
        _forceCreate: false,
        _limit: undefined,
        _item: undefined,
        setAttr: [],
      });
    });
  });
});
