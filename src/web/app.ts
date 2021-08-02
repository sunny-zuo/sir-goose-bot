import express, { Express } from 'express';
import Client from '../Client';
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

        app.use((req, _res, next) => {
            req.client = this.client;
            next();
        });

        app.use('/', indexRouter);
        app.use('/verify', verifyRouter);

        app.listen(process.env.PORT, () => {
            this.client.log.info(`Web app is listening on port ${process.env.PORT}`);
        });
    }
}
