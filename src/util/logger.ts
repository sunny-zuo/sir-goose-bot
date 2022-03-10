import pino from 'pino';

const transport =
    process.env.NODE_ENV === 'production'
        ? pino.transport({
              target: 'pino/file',
              options: { destination: '/logs/goose.log' },
          })
        : pino.transport({
              target: 'pino-pretty',
          });

export const logger = pino(transport);
