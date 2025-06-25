import { Service, Container } from 'typedi';
import { Logger } from 'winston';
import { SportsService } from './sports.service';
import { bet365Api } from '@config/constants';
import { OddsService } from './odds.service';

@Service()
export class PollingService {
  private logger: Logger = Container.get('logger');
  private sportsService: SportsService = Container.get(SportsService);
  private oddsService: OddsService = Container.get(OddsService);

  private upcomingEventsInterval: NodeJS.Timer | null = null;
  private oddsInterval: NodeJS.Timer | null = null;

  private testId: NodeJS.Timer | null = null;
  // Poll upcoming events every 5 minutes
  private readonly UPCOMING_EVENTS_INTERVAL = 5 * 60 * 1000;
  // Poll odds every 2minutes for upcoming events
  private readonly ODDS_INTERVAL = 2 * 60  * 1000;

  public startPolling(): void {
    this.logger.info('Starting polling service');
    
    // test polling
    // console.log("Polling service started");
    // this.testId = setInterval(() => {
    //     console.log(String(this.testId),"- Polling service running: ", new Date());
    // }, 5000);

    this.pollUpcomingEvents();

    this.upcomingEventsInterval = setInterval(() => {
      this.pollUpcomingEvents();
    }, this.UPCOMING_EVENTS_INTERVAL);

    // Start polling odds
    this.pollOdds();
    this.oddsInterval = setInterval(() => {
      this.pollOdds();
    }, this.ODDS_INTERVAL);
  }

  public stopPolling(): void {
    this.logger.info('Stopping polling service');

     if (this.testId) {
      clearInterval(this.testId as any);
      this.testId = null;
    }
    
    if (this.upcomingEventsInterval) {
      clearInterval(this.upcomingEventsInterval as NodeJS.Timeout);
      this.upcomingEventsInterval = null;
    }

    if (this.oddsInterval) {
      clearInterval(this.oddsInterval as NodeJS.Timeout);
      this.oddsInterval = null;
    }
  }

  private async pollUpcomingEvents(): Promise<void> {
    try {
      this.logger.info('Polling upcoming events');
      
      if (bet365Api.useMockData) {
        this.logger.info('Using mock data, skipping poll');
        return;
      }
      console.log("Polling upcoming events");

      await this.sportsService.fetchUpcomingEvents({ sportId: '3' }); // Example with soccer
    } catch (error) {
      this.logger.error('Error polling upcoming events:', error);
    }
  }

  private async pollOdds(): Promise<void> {
    try {
      this.logger.info('Polling odds data');
      
      if (bet365Api.useMockData) {
        this.logger.info('Using mock data, skipping poll');
        return;
      }

      // Get active events and poll their odds
      // cricket : 3
      const activeEvents = await this.sportsService.getUpcomingEvents("3");
      
      for (const event of activeEvents?.data || []) {
        console.log("Polling odds for event: ", event.eventId);
        await this.oddsService.getPreMatchOdds(event.eventId);
      }

    } catch (error) {
      this.logger.error('Error polling odds:', error);
    }
  }
}