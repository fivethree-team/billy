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
            const params = await this.controller.getArgs(hook.lane);
            const meta = this.controller.bodys.find(m => m.propertyKey === hook.lane.name);
            if (meta) {
                params.splice(meta.contextIndex, 0, req.body);
            }
            try {
                const ret = await this.controller.instance[hook.lane.name](...params)
                return ret;
            } catch (err) {
                await this.controller.handleCommandError(err);
            }
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