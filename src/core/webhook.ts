import { AppController } from './app';
import express from 'express';
import http from 'http';
const bodyParser = require('body-parser');

export class WebHook {
    private server: http.Server;
    private app: express.Express;
    constructor(private controller: AppController) {
        this.app = express();
        this.app.use(bodyParser.json());
    }

    /**
     * start the webhooks server
     *
     * @param {number} [port=7777]
     * @memberof CoreApi
     */
    startWebhooks(port = 7777) {

        this.controller.webhooks
            .forEach(hook => this.startWebhook(hook))
        this.server = this.app.listen(port);
    }

    private startWebhook(hook) {
        this.app.post(hook.path, async (req, res) => {
            this.controller.history.addToHistory({ name: hook.lane.name, description: 'running webhook', type: 'Webhook', time: Date.now(), history: [] })
            res.sendStatus(200)
            await this.controller.runLane(hook.lane, req.body);
        })
    }

    /**
     * Stop webhooks server
     *
     * @memberof CoreApi
     */
    stopWebhooks() {
        if (!this.server) { return }
        this.server.close(() => {
            console.log('Closed out remaining connections');
            process.exit(0);
        });
    }
}