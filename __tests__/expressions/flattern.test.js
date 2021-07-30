const { flatten } = require('../../lib/expressions/common');

describe('#expressions', () => {
  describe('flatten', () => {
    test('mixed json', async () => {
      const token = flatten({
        simplePath: 'strValue',
        'composed.path': 3,
        deep: {
          composed: {
            path: true,
          },
        },
      });

      expect(token).toEqual({
        simplePath: 'strValue',
        'composed.path': 3,
        'deep.composed.path': true,
      });
    });
  });
});
