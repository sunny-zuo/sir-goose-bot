import express, { Express } from 'express';
import Client from '../Client';

declare module 'express-serve-static-core' {
    interface Request {
        client?: Client;
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

        app.listen(process.env.PORT, () => {
            this.client.log.info(`Web app is listening on port ${process.env.PORT}`);
        });
    }
}
