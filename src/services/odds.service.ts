import { Service, Container } from "typedi";
import { Logger } from "winston";
import axios from "axios";
import cacheUtil from "@utils/cache";
// import { ServiceResponse } from '@interfaces/service-response.interface';
import { bet365Api } from "@config/constants";
import { BetsApiResponse } from "@interfaces/bets-api.interface";
import { transformInplayOddsData, transformPrematchOddsEntries } from "@utils/betsapi-transformers";
import { PreMatchOddsModel } from "@models/pre-match-odds.model";
import { InplayOddsModel } from "@models/in-play-odds.model";
import { ServiceResponse } from "@interfaces/service-response.interface";
import { EventModel } from "@models/event.model";
// import { PreMatchOddsModel } from '@models/pre-match-odds.model';

@Service()
export class OddsService {
  private logger: Logger = Container.get("logger");
  private apiUrl: string;
  private apiUrlV3: string;

  constructor() {
    this.apiUrl = bet365Api.baseUrl;
    this.apiUrlV3 = bet365Api.baseUrlV3;
    
  }

  public async getPreMatchOdds(eventId: string): Promise<BetsApiResponse> {
    try {
      this.logger.info(
        `OddsService - Fetching pre-match odds for event: ${eventId}`
      );

      const cacheKey = `preMatchOdds_${eventId}`;
      let response: BetsApiResponse;

      if (bet365Api.useMockData) {
        response = await axios
          .get("https://betsapi.com/docs/samples/bet365_prematch.json")
          .then((res) => res.data);
      } else {
        const cachedData = cacheUtil.get(cacheKey);
        if (cachedData) {
          this.logger.info("Using cached pre-match odds data");
          response = cachedData as BetsApiResponse;
        } else {
          const queryParams = new URLSearchParams({
            token: bet365Api.apiKey,
            FI: eventId,
          });

          response = await axios
            .get(`${this.apiUrlV3}/prematch?${queryParams.toString()}`)
            .then((res) => res.data);
          cacheUtil.set(cacheKey, response);
        }
      }

      if (!response.results || !response.results[0]) {
        return {
          success: 0,
          results: [],
          pager: {
            total: 0,
            page: 1,
            per_page: 100,
          },
        };
      }

      const transformedOdds = transformPrematchOddsEntries(response);
      await this.bulkUpsertPreMatchOdds(transformedOdds);
      return {
        success: 1,
        results: transformedOdds,
      };
    } catch (error) {
      this.logger.error("Error in getPreMatchOdds:", error);

      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          return {
            success: 0,
            // message: 'Event not found',
            results: null,
          };
        }
        if (error.response?.status === 429) {
          return {
            success: 0,
            // message: 'API rate limit exceeded',
            results: null,
          };
        }
      }

      return {
        success: 0,
        // message: 'Failed to fetch pre-match odds',
        results: null,
      };
    }
  }

  public async getInPlayOdds(fixtureId: string): Promise<BetsApiResponse> {
    try {
      this.logger.info(
        `OddsService - Fetching pre-match odds for event: ${fixtureId}`
      );

      const cacheKey = `inPlayOdds_${fixtureId}`;
      let response: BetsApiResponse;

      if (bet365Api.useMockData) {
        response = await axios
          .get("https://betsapi.com/docs/samples/bet365_event.cricket.json")
          .then((res) => res.data);
      } else {
        const cachedData = cacheUtil.get(cacheKey);
        if (cachedData) {
          this.logger.info("Using cached inplay-match odds data");
          response = cachedData as BetsApiResponse;
        } else {
          const queryParams = new URLSearchParams({
            token: bet365Api.apiKey,
            FI: fixtureId,
          });

          response = await axios
            .get(`${this.apiUrl}/event?${queryParams.toString()}`)
            .then((res) => res.data);
          cacheUtil.set(cacheKey, response, 2);
        }
      }

      if (!response.results || !response.results[0]) {
        return {
          success: 0,
          results: [],
          pager: {
            total: 0,
            page: 1,
            per_page: 100,
          },
        };
      }

      const transformedOdds = transformInplayOddsData(response, fixtureId, response?.stats?.event_id);
      await this.bulkUpsertInPlayOdds(transformedOdds);
      return {
        success: 1,
        results: transformedOdds,
      };
    } catch (error) {
      this.logger.error("Error in getInPlayOdds:", error);

      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          return {
            success: 0,
            // message: 'Event not found',
            results: null,
          };
        }
        if (error.response?.status === 429) {
          return {
            success: 0,
            // message: 'API rate limit exceeded',
            results: null,
          };
        }
      }

      return {
        success: 0,
        // message: 'Failed to fetch pre-match odds',
        results: null,
      };
    }
  }

  public async validateOdds(
    type: 'prematch' | 'inplay',
    eventId: string,
    marketId: string,
    outcomeId: string,
    odds: number
  ): Promise<ServiceResponse> {
    if (type === 'inplay'){
      // return error now because we don't support inplay odds validation for now
      return {
        success: false,
        message: "Inplay odds validation not supported",
        data: {
          currentOdds: null,
          reason: "Inplay odds validation not supported"
        }
      };
    }
    try {
      this.logger.info(`Validating odds for event: ${eventId}, market: ${marketId}, outcome: ${outcomeId}`);
  
      // Step 1: Basic odds value validation
      if (!odds || odds < 1.01 || odds > 1000) {
        return {
          success: false,
          message: "Invalid odds value",
          data: {
            currentOdds: null,
            reason: "Odds must be between 1.01 and 1000"
          }
        };
      }
  
      // Step 2: Check if the event/market/outcome exists in database
      const currentOdds = await PreMatchOddsModel.findOne({
        eventId,
        marketId,
        oddId: outcomeId
      }).sort({ updatedAt: -1 });
  
      if (!currentOdds) {
        return {
          success: false,
          message: "Market not found",
          data: {
            currentOdds: null,
            reason: "Selected market is no longer available"
          }
        };
      }
  
      // Step 3: Check if odds have changed
      const oddsThreshold = 0.01; // 1% difference threshold
      const oddsDifference = Math.abs(currentOdds.oddsValue - odds);
      const oddsPercentageDiff = oddsDifference / currentOdds.oddsValue;
  
      if (oddsPercentageDiff > oddsThreshold) {
        return {
          success: false,
          message: "Odds have changed",
          data: {
            currentOdds: currentOdds.oddsValue,
            previousOdds: odds,
            marketName: currentOdds.marketName,
            selectionName: currentOdds.oddName,
            reason: "Market odds have been updated"
          }
        };
      }
  
      // Step 4: Check if bet is still valid (based on event type)
      if (currentOdds.eventType === "prematch") {
        // Check if event hasn't started yet
        const event = await EventModel.findOne({ eventId});
        if (!event) {
          return {
            success: false,
            message: "Event not found",
            data: {
              currentOdds: null,
              reason: "Event not found"
            }
          };
        }
        const eventStartTime = new Date(event.startTime);
        console.log({eventStartTime})
        if (eventStartTime < new Date()) {
          return {
            success: false,
            message: "Event has started",
            data: {
              currentOdds: null,
              reason: "Cannot place pre-match bets after event start"
            }
          };
        }
      }
  
      // Step 5: All validations passed
      return {
        success: true,
        message: "Odds are valid",
        data: {
          currentOdds: currentOdds.oddsValue,
          marketName: currentOdds.marketName,
          selectionName: currentOdds.oddName,
          eventType: currentOdds.eventType,
          isActive: true
        }
      };
    } catch (error) {
      this.logger.error("Error validating odds:", error);
      return {
        success: false,
        message: "Failed to validate odds",
        data: {
          reason: "Internal validation error",
          currentOdds: null
        }
      };
    }
  }

  async bulkUpsertPreMatchOdds(odds: any[]): Promise<void> {
    if (!odds.length) return;

    const bulkOps = odds.map((odd) => {
      return {
        updateOne: {
          filter: { oddId: odd.oddId },
          update: {
            $set: {
              ...odd,
            },
          },
          upsert: true,
        },
      };
    });

    try {
      await PreMatchOddsModel.bulkWrite(bulkOps);
    } catch (error: any) {
      console.error("Bulk upsert error:", error.message);
      throw new Error("Bulk upsert failed");
    }
  }
  async bulkUpsertInPlayOdds(odds: any[]): Promise<void> {
    if (!odds.length) return;

    const bulkOps = odds.map((odd) => {
      return {
        updateOne: {
          filter: { 
            FI: odd.FI,
            marketId: odd.marketId 
           },
           update: {
            $set: {
              eventId: odd.eventId,
              marketName: odd.marketName,
              participants: odd.participants,
              updatedAt: new Date()
            }
          },
          upsert: true,
        },
      };
    });

    try {
      await InplayOddsModel.bulkWrite(bulkOps);
    } catch (error: any) {
      console.error("Bulk upsert error:", error.message);
      throw new Error("Bulk upsert failed");
    }
  }
}
