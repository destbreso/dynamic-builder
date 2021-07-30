// const Joi = require('joi');
// const { base } = require('../../api/schemas/res/common');

// expect.extend({
//   toMatchJoiSchema: (received, schema = base, many = false) => {
//     const targetSchema = many
//       ? Joi.array().items(schema)
//       : schema;
//     const result = Joi.validate(received, targetSchema);
//     if (result.error) {
//       return {
//         pass: false,
//         message: () => `Expected data not match with schema\n${result.error}`,
//       };
//     }
//     return {
//       pass: true,
//       message: () => 'Expected data not match with schema',
//     };
//   },
// });

// expect.extend({
//   toBeStdRes: (res, schema = base) => {
//     try {
//       expect(res.body).toMatchJoiSchema(schema);
//       return {
//         pass: true,
//         message: () => 'Expected res.body not match with schema',
//       };
//     } catch (e) {
//       return {
//         pass: false,
//         message: () => `Expected ${res.body} match with schema. ${e}`,
//       };
//     }
//   },
// });

// expect.extend({
//   toBeStdResRejectUnauthorized: (res) => {
//     try {
//       expect(res.statusCode).toBe(401);
//       expect(res.body).toContainAllKeys(['code', 'description', 'requestId']);
//       expect(res.body.code).toBe('0x00001009');
//       expect(res.body.description).toBe('client error. unauthorized.');
//       return {
//         pass: true,
//         message: () => 'Expected response not to be std rejected unauthorized',
//       };
//     } catch (e) {
//       return {
//         pass: false,
//         message: () => `Expected response to be std rejected unauthorized\n${e.stack}`,
//       };
//     }
//   },
// });

// expect.extend({
//   toBeStdResRejectForbidden: (res) => {
//     try {
//       expect(res.statusCode).toBe(403);
//       expect(res.body).not.toHaveProperty('body');
//       expect(res.body.code).toBe('0x00000809');
//       expect(res.body.description).toBe('client error. forbidden.');
//       expect(res.body).toContainAllKeys(['code', 'description', 'requestId']);
//       return {
//         pass: true,
//         message: () => 'Expected response to be std rejected Forbidden',
//       };
//     } catch (e) {
//       return {
//         pass: false,
//         message: () => `Expected response to be std rejected Forbidden\n${e.stack}`,
//       };
//     }
//   },
// });

// expect.extend({
//   toBeStdResRejectBadRequest: (res, msg) => {
//     try {
//       expect(res.statusCode).toBe(400);
//       expect(res.body.code).toBe('0x00000109');
//       expect(res.body.description).toBe('client error. bad request.');
//       expect(res.body.data).toBe(msg);
//       expect(res.body).toContainAllKeys(['data', 'code', 'description', 'requestId']);
//       return {
//         pass: true,
//         message: () => 'Expected response to be std rejected bad request',
//       };
//     } catch (e) {
//       return {
//         pass: false,
//         message: () => `Expected response to be std rejected bad request\n${e.stack}`,
//       };
//     }
//   },
// });

// expect.extend({
//   toBeStdSuccess: (res, expectStatus, schema, many = false) => {
//     try {
//       expect(res.statusCode).toEqual(expectStatus);
//       if (expectStatus !== 204) {
//         expect(res).toBeStdRes();
//         expect(res.body.code).toBe('0x00000002');
//         expect(res.body.description).toBe('success');
//         if (schema) expect(res.body.data).toMatchJoiSchema(schema, many);
//       }
//       return {
//         pass: true,
//         message: () => 'Expected response to be std success',
//       };
//     } catch (e) {
//       return {
//         pass: false,
//         message: () => `Expected response to be std success\n${e.stack}`,
//       };
//     }
//   },
// });
