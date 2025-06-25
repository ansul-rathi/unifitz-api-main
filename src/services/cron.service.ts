import { Service, Container } from "typedi";
import cron from "node-cron";
// import { Logger } from "winston";
import { FundistService } from "./fundist.service";

@Service()
export class CronService {
//   private logger: Logger = Container.get("logger");
  private fundistService: FundistService = Container.get(FundistService);


  public scheduleJobs(): void {
    cron.schedule("0 0 * * *", async () => {
      console.log("Running scheduled cron job...");
      await this.fundistService.getGameFullList();
      // await this.fundistService.syncGames();
    }, {
      scheduled: true,
      timezone: "UTC"
    });
  }

}
