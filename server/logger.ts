import pino from 'pino';

/**
 * Logger instance for server-side logging.
 *
 * Uses pino for fast, structured logging. In development, logs are pretty-printed
 * with colors and timestamps for easier debugging. In production, logs are output
 * in JSON format for performance and integration with log management systems.
 *
 * Configuration:
 * - LOG_LEVEL: Sets the minimum log level (default: 'info').
 * - NODE_ENV: If not 'production', enables pretty printing.
 *
 * Example usage:
 *   logger.info({ playerId }, 'Player connected');
 *   logger.error({ error }, 'Failed to start server');
 */
export const logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    transport:
        process.env.NODE_ENV !== 'production'
            ? {
                  target: 'pino-pretty',
                  options: {
                      colorize: true,
                      translateTime: 'HH:MM:ss',
                      ignore: 'pid,hostname',
                  },
              }
            : undefined,
});
