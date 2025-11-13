const { ZodError } = require("zod");

const formatError = (error) => {
  if (!(error instanceof ZodError)) {
    return { message: "Validation failed." };
  }

  const issues = Array.isArray(error.errors)
    ? error.errors
    : Array.isArray(error.issues)
      ? error.issues
      : [];

  return {
    message: "Validation failed.",
    errors: issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    })),
  };
};

const validateBody = (schema) => {
  return (req, res, next) => {
    try {
      req.body = schema.parse(req.body ?? {});
      next();
    } catch (error) {
      const formatted = formatError(error);
      res.status(400).json({ success: false, ...formatted });
    }
  };
};

const validateQuery = (schema) => {
  return (req, res, next) => {
    try {
      req.query = schema.parse(req.query ?? {});
      next();
    } catch (error) {
      const formatted = formatError(error);
      res.status(400).json({ success: false, ...formatted });
    }
  };
};

const validateParams = (schema) => {
  return (req, res, next) => {
    try {
      req.params = schema.parse(req.params ?? {});
      next();
    } catch (error) {
      const formatted = formatError(error);
      res.status(400).json({ success: false, ...formatted });
    }
  };
};

module.exports = {
  validateBody,
  validateQuery,
  validateParams,
};
