import pino from 'pino';

const transport =
    process.env.NODE_ENV === 'production'
        ? pino.transport({
              targets: [
                  ...(process.env.LOKI_URL
                      ? [
                            {
                                target: 'pino-loki',
                                level: 'debug',
                                options: { batching: false, host: process.env.LOKI_URL },
                            },
                        ]
                      : []),
                  {
                      target: 'pino/file',
                      level: 'info',
                      options: { destination: './logs/app.log', mkdir: true },
                  },
              ],
          })
        : pino.transport({
              target: 'pino-pretty',
          });

export const logger = pino(transport);
