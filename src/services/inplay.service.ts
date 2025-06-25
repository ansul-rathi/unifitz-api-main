import { Service, Container } from 'typedi';
import { Logger } from 'winston';
import axios from 'axios';
import { ServiceResponse } from '@interfaces/service-response.interface';
import { bet365Api } from '@config/constants';
import { IInplayEvent, IInplayBet } from '@interfaces/inplay.interface';

@Service()
export class InplayService {
  private logger: Logger = Container.get('logger');
  private apiUrl: string;

  constructor() {
    this.apiUrl = bet365Api.baseUrl;
  }

  public async fetchInplayEvents(): Promise<ServiceResponse> {
    try {
      this.logger.info('InplayService - Fetching inplay events');
      
      const response = await axios.get<IInplayEvent[]>(`${this.apiUrl}/inplay/events`);

      return {
        success: true,
        message: 'Inplay events retrieved successfully',
        data: response.data
      };
    } catch (error) {
      this.logger.error('Error in fetchInplayEvents:', error);
      return {
        success: false,
        message: 'Failed to fetch inplay events',
        data: null
      };
    }
  }

  public async placeBet(betData: IInplayBet): Promise<ServiceResponse> {
    try {
      this.logger.info('InplayService - Placing inplay bet');

      if (!this.isValidBet(betData)) {
        return {
          success: false,
          message: 'Invalid bet data',
          data: null
        };
      }

      const response = await axios.post(`${this.apiUrl}/inplay/bets`, betData);

      return {
        success: true,
        message: 'Inplay bet placed successfully',
        data: response.data
      };
    } catch (error) {
      this.logger.error('Error in placeBet:', error);
      return {
        success: false,
        message: 'Failed to place inplay bet',
        data: null
      };
    }
  }

  public async fetchOdds(eventId: string): Promise<ServiceResponse> {
    try {
      this.logger.info(`InplayService - Fetching odds for event: ${eventId}`);
      
      const response = await axios.get(`${this.apiUrl}/inplay/odds/${eventId}`);

      return {
        success: true,
        message: 'Odds retrieved successfully',
        data: response.data
      };
    } catch (error) {
      this.logger.error('Error in fetchOdds:', error);
      return {
        success: false,
        message: 'Failed to fetch odds',
        data: null
      };
    }
  }

  private isValidBet(bet: IInplayBet): boolean {
    return !!(bet.eventId && bet.selectionId && bet.amount && bet.odds);
  }
}