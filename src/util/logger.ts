import pino from 'pino';

const transport =
    process.env.NODE_ENV === 'production'
        ? pino.transport({
              targets: [
                  {
                      target: 'pino-loki',
                      level: 'debug',
                      options: { batching: false, host: 'http://loki:3100' },
                  },
                  {
                      target: 'pino/file',
                      level: 'info',
                      options: { destination: './logs' },
                  },
              ],
          })
        : pino.transport({
              target: 'pino-pretty',
          });

export const logger = pino(transport);
