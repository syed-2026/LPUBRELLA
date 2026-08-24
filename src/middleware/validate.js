const { ZodError } = require('zod');
const AppError = require('../utils/AppError');

// Validates req[part] (body/query/params) against a Zod schema and
// replaces it with the parsed (and thus coerced/trimmed) value.
// Produces a consistent validation error shape on failure.
function validate(schema, part = 'body') {
  return (req, res, next) => {
    try {
      const parsed = schema.parse(req[part]);
      req[part] = parsed;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const details = err.errors.map((e) => ({
          path: e.path.join('.'),
          message: e.message,
        }));
        return next(AppError.badRequest('Validation failed', 'VALIDATION_ERROR', details));
      }
      next(err);
    }
  };
}

module.exports = validate;
