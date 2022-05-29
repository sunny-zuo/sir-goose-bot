import pino from 'pino';

const transport =
    process.env.NODE_ENV === 'production'
        ? pino.transport({
              target: 'pino-loki',
              options: { batching: true, interval: 5, host: 'http://loki:3100' },
          })
        : pino.transport({
              target: 'pino-pretty',
          });

export const logger = pino(transport);
