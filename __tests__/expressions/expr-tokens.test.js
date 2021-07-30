const { exprTokenGenerator } = require('../../lib/expressions/operators');

describe('#expressions', () => {
  describe('expression tokens', () => {
    it('eq', async () => {
      const token = exprTokenGenerator('eq')('age', 33);
      expect(token).toStrictEqual('age = 33');
    });

    it('nq', async () => {
      const token = exprTokenGenerator('nq')('age', 33);
      expect(token).toStrictEqual('age <> 33');
    });

    it('lt', async () => {
      const token = exprTokenGenerator('lt')('age', 33);
      expect(token).toStrictEqual('age < 33');
    });

    it('le', async () => {
      const token = exprTokenGenerator('le')('age', 33);
      expect(token).toStrictEqual('age <= 33');
    });

    it('gt', async () => {
      const token = exprTokenGenerator('gt')('age', 33);
      expect(token).toStrictEqual('age > 33');
    });

    it('ge', async () => {
      const token = exprTokenGenerator('ge')('age', 33);
      expect(token).toStrictEqual('age >= 33');
    });

    it('attribute_exists', async () => {
      const token = exprTokenGenerator('attribute_exists')('age');
      expect(token).toStrictEqual('attribute_exists(age)');
    });

    it('attribute_not_exists', async () => {
      const token = exprTokenGenerator('attribute_not_exists')('age');
      expect(token).toStrictEqual('attribute_not_exists(age)');
    });

    it('begins_with', async () => {
      const token = exprTokenGenerator('begins_with')('name', 'AAA');
      expect(token).toStrictEqual('begins_with(name,AAA)');
    });

    it('between', async () => {
      const token = exprTokenGenerator('between')('age', [35, 50]);
      expect(token).toStrictEqual('age BETWEEN 35 AND 50');
    });

    it('bad_operator', async () => {
      expect(() => {
        exprTokenGenerator('bad_operator')('age', [35, 50]);
      }).toThrowError('unsuported operator \'bad_operator\'');
    });
  });
});
