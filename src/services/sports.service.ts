import { Service, Container } from "typedi";
import { Logger } from "winston";
import axios from "axios";
import cacheUtil from "@utils/cache";
import { ServiceResponse } from "@interfaces/service-response.interface";
import {
  IUpcomingEventsParams,
} from "@interfaces/sports.interface";
import { bet365Api } from "@config/constants";
import { IEvent } from "@interfaces/events.interface";
import { SportModel } from "@models/sports.model";
import { BetsApiEvent, BetsApiResponse } from "@interfaces/bets-api.interface";
import { EventModel } from "@models/event.model";
import { transformEvents, transformResults } from "@utils/betsapi-transformers";
import { ResultModel } from "@models/results.model";

@Service()
export class SportsService {
  private logger: Logger = Container.get("logger");
  private apiUrl: string;

  constructor() {
    this.apiUrl = bet365Api.baseUrl;
  }

  public async fetchSports(): Promise<ServiceResponse> {
    try {
      this.logger.info("SportsService - Fetching sports list");

      const sports = await SportModel.find({ active: true })
        .select("sportId name")
        .sort({ name: 1 })
        .lean();

      return {
        success: true,
        message: "Sports list retrieved successfully",
        data: sports,
      };
    } catch (error) {
      this.logger.error("Error in fetchSports:", error);
      return {
        success: false,
        message: "Failed to fetch sports list",
        data: null,
      };
    }
  }

  // public async fetchSportEvents(sportId: string): Promise<ServiceResponse> {
  //   try {
  //     this.logger.info(`SportsService - Fetching events for sport: ${sportId}`);

  //     const response = await axios.get<ISportEvent[]>(`${this.apiUrl}/sports/${sportId}/events`);

  //     return {
  //       success: true,
  //       message: 'Sport events retrieved successfully',
  //       data: response.data
  //     };
  //   } catch (error) {
  //     this.logger.error('Error in fetchSportEvents:', error);
  //     return {
  //       success: false,
  //       message: 'Failed to fetch sport events',
  //       data: null
  //     };
  //   }
  // }

  public async fetchPopularEvents(): Promise<ServiceResponse> {
    try {
      this.logger.info("SportsService - Fetching popular events");

      const response = await axios.get(`${this.apiUrl}/sports/popular`);

      return {
        success: true,
        message: "Popular events retrieved successfully",
        data: response.data,
      };
    } catch (error) {
      this.logger.error("Error in fetchPopularEvents:", error);
      return {
        success: false,
        message: "Failed to fetch popular events",
        data: null,
      };
    }
  }

  public async fetchUpcomingEvents(
    params: IUpcomingEventsParams
  ): Promise<BetsApiResponse> {
    try {
      this.logger.info("SportsService - Fetching upcoming events");

      // Build query parameters
      const queryParams = new URLSearchParams();
      if (params.sportId) {
        queryParams.append("sport_id", params.sportId);
      }
      // queryParams.append('limit', (params.limit || 10).toString());
      // queryParams.append('offset', (params.offset || 0).toString());
      let response: BetsApiResponse;

      if (bet365Api.useMockData) {
        response = await axios
          .get("https://betsapi.com/docs/samples/upcoming.json")
          .then((res) => res.data);
      } else {
        const cacheKey = `upcomingEvents_${params.sportId}`;
        const cachedData = cacheUtil.get<BetsApiResponse>(cacheKey);
        if (cachedData) {
          response = cachedData;
        } else {
          queryParams.append("token", bet365Api.apiKey);
          response = await axios
            .get(`${this.apiUrl}/upcoming?${queryParams.toString()}`)
            .then((res) => res.data);
          cacheUtil.set(cacheKey, response);
        }
      }

      const transformedEvents = transformEvents(
        response.results as BetsApiEvent[]
      );
      const responseToReturn = {
        success: 1,
        results: transformedEvents,
        pager: {
          page: response.pager.page,
          per_page: response.pager.per_page,
          total: response.pager.total,
        },
      };

      await this.bulkUpsertEvents(transformedEvents);
      return responseToReturn;
    } catch (error) {
      this.logger.error("Error in fetchUpcomingEvents:", error);
      return {
        success: 0,
        results: [],
        pager: {
          page: 0,
          per_page: 0,
          total: null,
        },
      };
    }
  }
  public async fetchInplayEvents(
    params: IUpcomingEventsParams
  ): Promise<BetsApiResponse> {
    try {
      this.logger.info("SportsService - Fetching inplay events");

      // Build query parameters
      const queryParams = new URLSearchParams();
      if (params.sportId) {
        queryParams.append("sport_id", params.sportId);
      }
      // queryParams.append('limit', (params.limit || 10).toString());
      // queryParams.append('offset', (params.offset || 0).toString());
      let response: BetsApiResponse;

      if (bet365Api.useMockData) {
        response = await axios
          .get("https://betsapi.com/docs/samples/bet365_inplay_filter.json")
          .then((res) => res.data);
      } else {
        const cacheKey = `inplayEvents_${params.sportId}`;
        const cachedData = cacheUtil.get<BetsApiResponse>(cacheKey);
        if (cachedData) {
          response = cachedData;
        } else {
          queryParams.append("token", bet365Api.apiKey);
          response = await axios
            .get(`${this.apiUrl}/inplay_filter?${queryParams.toString()}`)
            .then((res) => res.data);
          console.log("cachedData set for inplay events");
          cacheUtil.set(cacheKey, response);
        }
      }

      const transformedEvents = transformEvents(
        response.results as BetsApiEvent[]
      );
      const responseToReturn = {
        success: 1,
        results: transformedEvents,
        pager: {
          page: response.pager.page,
          per_page: response.pager.per_page,
          total: response.pager.total,
        },
      };

      await this.bulkUpsertEvents(transformedEvents);
      return responseToReturn;
    } catch (error) {
      this.logger.error("Error in fetchUpcomingEvents:", error);
      return {
        success: 0,
        results: [],
        pager: {
          page: 0,
          per_page: 0,
          total: null,
        },
      };
    }
  }

  public async getUpcomingEvents(sportId?: string): Promise<ServiceResponse> {
    try {
      this.logger.info('SportsService - Getting upcoming events');
      
      const events = await EventModel.findUpcoming(sportId);
      
      return {
        success: true,
        message: 'Upcoming events retrieved successfully',
        data: events
      };
    } catch (error) {
      this.logger.error('Error fetching upcoming events:', error);
      return {
        success: false,
        message: 'Failed to fetch upcoming events',
        data: null
      };
    }
  }

  public async fetchResults(
    params: {eventId: string}
  ): Promise<BetsApiResponse> {
    try {
      this.logger.info("SportsService - Fetching result event");

      // Build query parameters
      const queryParams = new URLSearchParams();
      if (params.eventId) {
        queryParams.append("event_id", params.eventId);
      }
      let response: BetsApiResponse;

      if (bet365Api.useMockData) {
        response = await axios
          .get("https://betsapi.com/docs/samples/bet365_inplay_filter.json")
          .then((res) => res.data);
      } else {
        const cacheKey = `result_${params.eventId}`;
        const cachedData = cacheUtil.get<BetsApiResponse>(cacheKey);
        if (cachedData) {
          console.log("cachedData used for result");
          response = cachedData;
        } else {
          queryParams.append("token", bet365Api.apiKey);
          response = await axios
            .get(`${this.apiUrl}/result?${queryParams.toString()}`)
            .then((res) => res.data);
          console.log("cachedData set for results");
          cacheUtil.set(cacheKey, response, 60 * 60 * 24);
        }
      }

      const transformedEvents = transformResults(
        response.results as BetsApiEvent[]
      );
      const responseToReturn = {
        success: 1,
        results: transformedEvents,
      };
      await ResultModel.upsertResult(transformedEvents[0]);
      return responseToReturn;
    } catch (error) {
      this.logger.error("Error in fetch results:", error);
      return {
        success: 0,
        results: [],
        pager: {
          page: 0,
          per_page: 0,
          total: null,
        },
      };
    }
  }


  // public async fetchSportEventOdds(
  //   sportId: string,
  //   marketType?: string
  // ): Promise<ServiceResponse> {
  //   try {
  //     this.logger.info(`SportsService - Fetching odds for sport: ${sportId}`);

  //     // Build query parameters
  //     const queryParams = new URLSearchParams();
  //     if (marketType) {
  //       queryParams.append("market", marketType);
  //     }

  //     const response = await axios.get<ISportOdds[]>(
  //       `${this.apiUrl}/sports/${sportId}/odds?${queryParams.toString()}`,
  //       {
  //         headers: {
  //           Authorization: `Bearer ${bet365Api.apiKey}`,
  //           Accept: "application/json",
  //         },
  //       }
  //     );

  //     // Transform and enrich odds data
  //     const enrichedOdds = response.data.map((eventOdds) => ({
  //       ...eventOdds,
  //       lastUpdated: new Date(eventOdds.lastUpdated),
  //       markets: eventOdds.markets.map((market) => ({
  //         ...market,
  //         selections: market.selections.map((selection) => ({
  //           ...selection,
  //           probability: Number(((1 / selection.odds) * 100).toFixed(2)), // Calculate implied probability
  //         })),
  //       })),
  //     }));

  //     return {
  //       success: true,
  //       message: "Sport odds retrieved successfully",
  //       data: {
  //         odds: enrichedOdds,
  //         metadata: {
  //           sportId,
  //           marketType,
  //           timestamp: new Date(),
  //           provider: "bet365",
  //         },
  //       },
  //     };
  //   } catch (error) {
  //     this.logger.error("Error in fetchSportOdds:", error);

  //     // Handle specific error cases
  //     if (axios.isAxiosError(error)) {
  //       if (error.response?.status === 404) {
  //         return {
  //           success: false,
  //           message: "No odds found for this sport",
  //           data: null,
  //         };
  //       }
  //       if (error.response?.status === 429) {
  //         return {
  //           success: false,
  //           message: "API rate limit exceeded",
  //           data: null,
  //         };
  //       }
  //     }

  //     return {
  //       success: false,
  //       message: "Failed to fetch sport odds",
  //       data: null,
  //     };
  //   }
  // }
 

  /**
   * Bulk upsert events into MongoDB.
   * @param events Array of event objects from the API
   */
  async bulkUpsertEvents(events: IEvent[]): Promise<void> {
    if (!events.length) return;

    const bulkOps = events.map((event) => {
      return {
        updateOne: {
          filter: { eventId: event.eventId },
          update: {
            $set: {
              ...event,
            },
          },
          upsert: true,
        },
      };
    });

    try {
      await EventModel.bulkWrite(bulkOps);
    } catch (error: any) {
      console.error("Bulk upsert error:", error.message);
      throw new Error("Bulk upsert failed");
    }
  }
}
