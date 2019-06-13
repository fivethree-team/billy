import { AppController } from './app';
import { JobModel } from '../types';
import scheduler from 'node-schedule';
import { beforeAll, afterAll } from './hooks';

export class Scheduler {

    constructor(private controller: AppController) { }

    /**
     * start all the scheduled Jobs in your billy application
     *
     * @returns {JobModel[]}
     * @memberof CoreApi
     */
    startJobs(): JobModel[] {
        this.controller
            .jobs.forEach(job => job = this.startJob(job));
        return this.controller.jobs;
    }

    /**
     * schedule a single job
     *
     * @param {JobModel} job job that will be scheduled
     * @returns {JobModel} returns the updated job, with scheduler attached
     * @memberof CoreApi
     */
    private startJob(job: JobModel): JobModel {
        const instance = scheduler.scheduleJob(job.schedule, async (fireDate) => {
            this.controller.history.addToHistory({ name: job.lane.name, description: 'running scheduled lane', type: 'Job', time: Date.now(), history: [] })
            await this.controller.runHook(beforeAll);
            await this.controller.runCommand(job.lane);
            await this.controller.runHook(afterAll);
            this.controller.history.clear();
        });
        job.scheduler = instance;
        return job;
    }

    /**
     * cancel all scheduled lanes
     *
     * @returns {JobModel[]}
     * @memberof CoreApi
     */
    cancelJobs(): JobModel[] {
        this.controller.jobs
            .forEach(job => {
                job.scheduler.cancel();
            });

        return this.controller.jobs;
    }
}
