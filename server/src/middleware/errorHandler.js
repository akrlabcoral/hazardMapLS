/**
 * Global error handler middleware.
 * Returns structured JSON errors. Hides stack traces in production.
 */
export default function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  console.error(`[ERROR] ${req.method} ${req.originalUrl} - ${status}: ${message}`);
  if (process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }

  res.status(status).json({
    error: {
      message,
      status,
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    }
  });
}
