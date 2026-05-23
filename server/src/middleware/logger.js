/**
 * Custom request logger middleware.
 * Uses colored output in development, structured JSON in production.
 */
export default function requestLogger(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const color = status >= 500 ? '\x1b[31m' : status >= 400 ? '\x1b[33m' : '\x1b[32m';
    const reset = '\x1b[0m';

    if (process.env.NODE_ENV === 'production') {
      console.log(JSON.stringify({
        method: req.method,
        url: req.originalUrl,
        status,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      }));
    } else {
      console.log(`${color}${req.method}${reset} ${req.originalUrl} ${color}${status}${reset} - ${duration}ms`);
    }
  });

  next();
}
