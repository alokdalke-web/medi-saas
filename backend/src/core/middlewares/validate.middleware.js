const validateRequest = (schema) => async (req, res, next) => {
  try {
    await schema.parseAsync({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    return next();
  } catch (error) {
    const errors = error.errors.map((err) => ({
      path: err.path.join('.'),
      message: err.message,
    }));
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors,
    });
  }
};

module.exports = validateRequest;
