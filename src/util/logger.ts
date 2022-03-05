import pino from 'pino';

const transport = pino.transport({
    target: 'pino/file',
    options: { destination: './logs.json' },
});

export const logger = pino(transport);
