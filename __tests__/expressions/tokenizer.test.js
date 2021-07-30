const { tokenize } = require('../../lib/expressions/common');

// console.log(require('util').inspect(token, { depth: 10, colors: true }));

describe('#expressions', () => {
  describe('tokenizer', () => {
    it('simplePath', async () => {
      const token = tokenize(['simplePath']);

      expect(token).toEqual({
        simplePath: {
          nameInExpression: '#simplePath',
          valueInExpression: ':simplePath',
          attrNames: { '#simplePath': 'simplePath' },
        },
      });
    });

    it('[multiple,deep.composed.paths]', async () => {
      const token = tokenize(['multiple', 'deep.composed.paths']);

      expect(token).toEqual({
        multiple: {
          nameInExpression: '#multiple',
          valueInExpression: ':multiple',
          attrNames: { '#multiple': 'multiple' },
        },
        'deep.composed.paths': {
          nameInExpression: '#deep.#composed.#paths',
          valueInExpression: ':deepcomposedpaths',
          attrNames: { '#deep': 'deep', '#composed': 'composed', '#paths': 'paths' },
        },
      });
    });
  });
});
