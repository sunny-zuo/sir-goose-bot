import express, { Express } from 'express';
import path from 'path';
import pino from 'pino';
import pinoHttp from 'pino-http';
import { logger } from '#util/logger';
import Client from '#src/Client';
import indexRouter from './routes/index';
import verifyRouter from './routes/verify';

declare module 'express-serve-static-core' {
    interface Request {
        client: Client;
    }
}

export class WebApp {
    app: Express;
    client: Client;

    constructor(client: Client) {
        this.app = express();
        this.client = client;
    }

    init(): void {
        const app = this.app;

        app.use(pinoHttp({ logger: pino() }));

        app.use((req, _res, next) => {
            req.client = this.client;
            next();
        });

        app.use(express.static(path.join(process.cwd(), 'src', 'web', 'public')));

        app.use('/', indexRouter);
        app.use('/verify', verifyRouter);

        app.listen(process.env.PORT, () => {
            logger.info(`Web app is listening on port ${process.env.PORT}`);
        });
    }
}
