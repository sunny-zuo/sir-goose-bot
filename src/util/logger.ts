import pino from 'pino';

const transport =
    process.env.NODE_ENV === 'production'
        ? pino.transport({
              target: 'pino-loki',
              options: { batching: false, host: 'http://loki:3100' },
          })
        : pino.transport({
              target: 'pino-pretty',
          });

export const logger = pino(transport);
