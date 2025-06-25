import { Service } from "typedi";
import { Container } from "typedi";
import { Logger } from "winston";
import crypto from "crypto";
import axios from "axios";

import cacheUtil from "@utils/cache";
import { ServiceResponse } from "@interfaces/service-response.interface";
import {
  IFundistAddUserRequest,
  IGameLaunchRequest,
  IGameSortingRequest,
  ILobbyStateRequest,
} from "@interfaces/fundist.interface";
import { fundistConfig } from "@config/constants";
import { FundistRestrictedCountryService } from "./fundist-restricted-country.service";
import { RestrictedCountryModel } from "@models/fundist-restricted-country.model";
import { FundistGameModel, IFundistGame } from "@models/fundist-game.model";
import { TransactionModel } from "@models/transactions.model";
import { WalletModel } from "@models/wallet.model";
// import {  getServerIp } from "@utils/index";

@Service()
export class FundistService {
  private logger: Logger = Container.get("logger");
  private restrictedCountryService: FundistRestrictedCountryService =
    Container.get(FundistRestrictedCountryService);

  private secretKey: string = fundistConfig.hmacSecret;
  private endUrl: string = fundistConfig.apiEndUrl;
  private apiKey: string = fundistConfig.apiKey;
  private apiPassword: string = fundistConfig.apiPassword;
  private serverIp: string = "0.0.0.0";

  constructor() {
    if (!this.secretKey) {
      throw new Error("Secret key is required for HMAC authentication");
    }
  }
  private generateTid(prefix: string = ""): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const uniqueId = `${prefix}${timestamp}_${random}`.substring(0, 32); // Ensure max 32 chars
    return uniqueId;
  }

  //   hashes
  private generateUserHash(params: IFundistAddUserRequest): string {
    const hashString = `User/Add/${this.serverIp}/${params.tid}/${this.apiKey}/${params.login}/${params.password}/${params.currency}/${this.apiPassword}`;
    return crypto.createHash("md5").update(hashString).digest("hex");
  }

  private generateLobbyStateHash(tid: string): string {
    const hashString = `Tables/LobbyState/${this.serverIp}/${tid}/${this.apiKey}/${this.apiPassword}`;
    return crypto.createHash("md5").update(hashString).digest("hex");
  }
  private generateAllGameListHash(tid: string): string {
    const hashString = `Game/FullList/${this.serverIp}/${tid}/${this.apiKey}/${this.apiPassword}`;
    return crypto.createHash("md5").update(hashString).digest("hex");
  }

  private generateGameListHash(tid: string): string {
    const hashString = `Game/List/${this.serverIp}/${tid}/${this.apiKey}/${this.apiPassword}`;
    return crypto.createHash("md5").update(hashString).digest("hex");
  }
  private generateCategoriesHash(tid: string): string {
    const hashString = `Game/Categories/${this.serverIp}/${tid}/${this.apiKey}/${this.apiPassword}`;
    return crypto.createHash("md5").update(hashString).digest("hex");
  }
  private generateAuthHtmlHash(params: {
    login: string;
    password: string;
    system: string;
    tid: string;
  }): string {
    const hashString = `User/AuthHTML/${this.serverIp}/${params.tid}/${this.apiKey}/${params.login}/${params.password}/${params.system}/${this.apiPassword}`;
    return crypto.createHash("md5").update(hashString).digest("hex");
  }
  private generateSortingHash(tid: string): string {
    const hashString = `Game/Sorting/${this.serverIp}/${tid}/${this.apiKey}/${this.apiPassword}`;
    return crypto.createHash("md5").update(hashString).digest("hex");
  }

  //   apis

  /**
   * Launches a game and returns the URL for the game.
   *
   * @param {IFundistAddUserRequest} params - Parameters for launching the game.
   * @returns {Promise<ServiceResponse>} - A promise that resolves to a ServiceResponse object.
   * The ServiceResponse object contains a success flag, a message, and an object with the following properties:
   * - url: The URL of the game to launch.
   * - tid: The transaction ID for the game launch request.
   * - system: The system of the game to launch.
   * - page: The page of the game to launch.
   */
  public async launchGame(
    params: IGameLaunchRequest
  ): Promise<ServiceResponse> {
    try {
      const tid = params.tid || this.generateTid("LAUNCH_");

      const hash = this.generateAuthHtmlHash({
        login: params.login,
        password: params.password,
        system: params.system,
        tid,
      });

      // Build query parameters
      const queryString = [
        `Login=${params.login}`,
        `Password=${params.password}`,
        `System=${params.system}`,
        `TID=${tid}`,
        `Hash=${hash}`,
        `Page=${params.page}`,
        `UserIP=${params.userIp || "127.0.0.1"}`,
        `Currency=${params.currency || "INR"}`,
        // `UniversalLaunch=1`
        // 'UserAutoCreate=1'
      ];

      // Add optional parameters
      if (params.demo) queryString.push("Demo=1");
      if (params.country) queryString.push(`Country=${params.country}`);
      if (params.language) queryString.push(`Language=${params.language}`);

      const url = `${this.endUrl}/System/Api/${this.apiKey}/User/AuthHTML/?&${queryString.join("&")}`;

      const response = await axios.get(url, {
        timeout: 30000,
        headers: {
          Accept: "application/json",
        },
      });

      if (response.status === 200) {
        return {
          success: true,
          message: "Game launch URL generated successfully",
          data: {
            url: response.data,
            // tid,
            system: params.system,
            page: params.page,
          },
        };
      }

      throw new Error(response.data || "Invalid game launch response");
    } catch (error) {
      this.logger.error("Error launching game:", {
        error: error.message,
        params,
        stack: error.stack,
      });

      return {
        success: false,
        message: error.message || "Failed to launch game",
        data: null,
      };
    }
  }
  // Helper method to find game launch parameters

  public async addUser(
    params: IFundistAddUserRequest
  ): Promise<ServiceResponse> {
    try {
      // Validate login format
      if (!/^[0-9a-zA-Z_-]{1,29}$/.test(params.login)) {
        throw new Error("Invalid login format");
      }

      // Validate password
      if (
        params.password.length < 6 ||
        params.password.includes(params.login)
      ) {
        throw new Error("Invalid password");
      }

      // Validate timezone if present
      if (
        params.timezone !== undefined &&
        (params.timezone < -720 || params.timezone > 720)
      ) {
        throw new Error("Invalid timezone");
      }

      // Validate date of birth if present
      if (
        params.dateOfBirth &&
        !/^\d{4}-\d{2}-\d{2}$/.test(params.dateOfBirth)
      ) {
        throw new Error("Invalid date of birth format");
      }

      const tid = this.generateTid("ADD_");
      params.tid = tid;
      // Generate hash
      const hash = this.generateUserHash(params);

      // Build query parameters
      const queryParams = new URLSearchParams({
        Login: params.login,
        Password: params.password,
        TID: tid,
        Currency: params.currency,
        Hash: hash,
        Language: params.language,
        RegistrationIP: params.registrationIP,
        ...(params.gender && { Gender: params.gender }),
        ...(params.country && { Country: params.country }),
        ...(params.dateOfBirth && { DateOfBirth: params.dateOfBirth }),
        ...(params.nick && { Nick: params.nick }),
        ...(params.timezone && { Timezone: params.timezone.toString() }),
        ...(params.name && { Name: params.name }),
        ...(params.lastName && { LastName: params.lastName }),
        ...(params.phone && { Phone: params.phone }),
        ...(params.alternativePhone && {
          AlternativePhone: params.alternativePhone,
        }),
        ...(params.city && { City: params.city }),
        ...(params.address && { Address: params.address }),
        ...(params.email && { Email: params.email }),
        ...(params.affiliateId && { AffiliateID: params.affiliateId }),
      });

      const url = `${this.endUrl}/System/Api/${this.apiKey}/User/Add/?&${queryParams.toString()}`;

      const response = await axios.get(url);
      if (response.data === "1" || response.data === 1) {
        return {
          success: true,
          message: "User added successfully",
          data: {
            login: params.login,
            currency: params.currency,
          },
        };
      }

      // Handle error codes from Appendix 1
      throw new Error(response.data);
    } catch (error) {
      this.logger.error("Error adding user:", error);
      return {
        success: false,
        message: error.message || "Failed to add user",
        data: null,
      };
    }
  }

  public async getSortedGames(
    params: IGameSortingRequest
  ): Promise<ServiceResponse> {
    const cacheKey = `fundistSortedGames:${params.type}`;

    try {
      // Check cache first
      const cachedData = cacheUtil.get(cacheKey);
      if (cachedData) {
        this.logger.debug("Using cached sorted games data");
        return {
          success: true,
          message: "Sorted games retrieved from cache",
          data: cachedData,
        };
      }

      const tid = params.tid || this.generateTid("SORT_");
      const hash = this.generateSortingHash(tid);

      // Build URL
      const queryParams = new URLSearchParams({
        TID: tid,
        Hash: hash,
        Type: params.type,
      });

      const url = `${this.endUrl}/System/Api/${this.apiKey}/Game/Sorting/?${queryParams.toString()}`;

      this.logger.debug("Getting sorted games:", {
        tid,
        type: params.type,
        url,
      });

      const response = await axios.get(url, {
        timeout: 30000,
        headers: {
          Accept: "application/json",
        },
      });

      if (typeof response.data === "object") {
        // Cache for 15 minutes since this is dynamic content
        cacheUtil.set(cacheKey, response.data, 900);

        return {
          success: true,
          message: `${params.type.toUpperCase()} games retrieved successfully`,
          data: response.data,
        };
      }

      throw new Error("Invalid response format");
    } catch (error) {
      this.logger.error("Error getting sorted games:", {
        error: error.message,
        type: params.type,
        stack: error.stack,
      });

      return {
        success: false,
        message: error.message || "Failed to retrieve sorted games",
        data: null,
      };
    }
  }

  public async getCategories(tid?: string): Promise<ServiceResponse> {
    const cacheKey = "fundistCategories";
    try {
      const cachedData = cacheUtil.get(cacheKey);
      if (cachedData) {
        this.logger.debug("Using cached categories data");
        return {
          success: true,
          message: "Categories retrieved from cache",
          data: cachedData,
        };
      }

      if (!tid) {
        tid = this.generateTid("CAT_");
      }

      const hash = this.generateCategoriesHash(tid);

      // Build URL
      const queryParams = new URLSearchParams({
        TID: tid,
        Hash: hash,
      });

      const url = `${this.endUrl}/System/Api/${this.apiKey}/Game/Categories/?${queryParams.toString()}`;
      this.logger.debug("Getting categories:", { url, tid });

      // Make request
      const response = await axios.get(url, {
        timeout: 30000, // 30 seconds timeout
        headers: {
          Accept: "application/json",
        },
      });

      // Check if response is valid JSON
      if (typeof response.data === "object") {
        // Cache the response for 1 hour
        cacheUtil.set(cacheKey, response.data, 3600);
        return {
          success: true,
          message: "Categories retrieved successfully",
          data: response.data,
        };
      }

      throw new Error("Invalid response format");
    } catch (error) {
      this.logger.error("Error getting categories:", {
        error: error.message,
        tid,
        stack: error.stack,
      });

      return {
        success: false,
        message:
          error?.response?.data ||
          error.message ||
          "Failed to retrieve categories",
        data: null,
      };
    }
  }

  public async getGameFullList(tid?: string): Promise<ServiceResponse> {
    const cacheKey = "fundistGameFullList";
    try {
      // Check cache first
      const cachedData = cacheUtil.get(cacheKey);
      if (cachedData) {
        return {
          success: true,
          message: "Game list retrieved from cache",
          data: cachedData,
        };
      }
      if (!tid) {
        tid = this.generateTid("LIST_");
      }

      const hash = this.generateAllGameListHash(tid);
      // Build URL
      const queryParams = new URLSearchParams({
        TID: tid,
        Hash: hash,
      });

      const url = `${this.endUrl}/System/Api/${this.apiKey}/Game/FullList/?&${queryParams.toString()}`;

      // Make request
      const response = await axios.get(url);

      // Check if response is valid JSON
      if (typeof response.data === "object") {
        await this.restrictedCountryService.storeRestrictedCountries(
          response.data.countriesRestrictions
        );
        const formattedData = {
          status: "OK",
          games: response.data.games,
          categories: response.data.categories,
          restrictedCountries: response.data.countriesRestrictions,
          merchants: response.data.merchants,
          merchantsCurrencies: response.data.merchantsCurrencies,
        };
        // Cache the response for 1 hour
        cacheUtil.set(cacheKey, formattedData, 3600 * 12);

        return {
          success: true,
          message: "Game list retrieved successfully",
          data: formattedData,
        };
      }

      throw new Error("Invalid response format");
    } catch (error) {
      this.logger.error("Error getting game list:", error);
      return {
        success: false,
        message: error.message || "Failed to retrieve game list",
        data: null,
        // data: this.formatResponse(false, null, error.message)
      };
    }
  }

  // Add helper method to categorize games
  public async getGamesByCategory(
    categoryId?: string
  ): Promise<ServiceResponse> {
    try {
      const tid = this.generateTid("CAT_");
      const result = await this.getGameFullList(tid);

      if (!result.success) {
        return result;
      }

      const { games, categories } = result.data;

      if (categoryId) {
        const filteredGames = games.filter((game) =>
          game.categories.includes(categoryId)
        );

        return {
          success: true,
          message: "Games retrieved successfully",
          data: {
            status: "OK",
            games: filteredGames,
            category: categories.find((c) => c.id === categoryId),
            count: filteredGames.length,
            // hmac: this.generateHMAC({
            //   status: 'OK',
            //   count: filteredGames.length
            // })
          },
        };
      }

      // Group games by category
      const gamesByCategory = categories.reduce(
        (acc, category) => {
          acc[category.id] = games.filter((game) =>
            game.categories.includes(category.id)
          );
          return acc;
        },
        {} as Record<string, any[]>
      );

      return {
        success: true,
        message: "Games grouped by category retrieved successfully",
        data: {
          status: "OK",
          gamesByCategory,
          categories,
          totalGames: games.length,
          //   hmac: this.generateHMAC({
          //     status: 'OK',
          //     count: games.length
          //   })
        },
      };
    } catch (error) {
      this.logger.error("Error processing games by category:", error);
      return {
        success: false,
        message: error.message || "Failed to process games by category",
        // data: this.formatResponse(false, null, error.message)
        data: null,
      };
    }
  }

  public async getLobbyState(
    params: ILobbyStateRequest
  ): Promise<ServiceResponse> {
    // const cacheKey = `fundistLobbyState:${params.tables.join(',')}`;

    try {
      // Check cache first (with short TTL for real-time data)
      // const cachedData = cacheUtil.get(cacheKey);
      // if (cachedData) {
      //   this.logger.debug("Using cached lobby state data");
      //   return {
      //     success: true,
      //     message: "Lobby state retrieved from cache",
      //     data: cachedData
      //   };
      // }

      const tid = params.tid || this.generateTid("LOBBY_");
      const hash = this.generateLobbyStateHash(tid);

      // Build query string manually to ensure proper array format
      const queryString = [
        `Tables=${JSON.stringify(params.tables)}`,
        `TID=${tid}`,
        `Hash=${hash}`,
      ].join("&");

      const url = `${this.endUrl}/System/Api/${this.apiKey}/Tables/LobbyState/?${queryString}`;

      this.logger.debug("Getting lobby state:", {
        tid,
        tables: params.tables,
        url,
      });

      const response = await axios.get(url, {
        timeout: 10000, // Shorter timeout for real-time data
        headers: {
          Accept: "application/json",
        },
      });

      if (typeof response.data === "object") {
        // Cache the response for a short period (30 seconds)
        // cacheUtil.set(cacheKey, response.data, 30);

        return {
          success: true,
          message: "Lobby state retrieved successfully",
          data: response.data,
        };
      }

      throw new Error("Invalid response format");
    } catch (error) {
      this.logger.error("Error getting lobby state:", {
        error: error.message,
        tables: params.tables,
        stack: error.stack,
      });

      return {
        success: false,
        message: error.message || "Failed to retrieve lobby state",
        data: null,
      };
    }
  }

  public async getGames(tid?: string): Promise<ServiceResponse> {
    const cacheKey = "fundistGameList";
    try {
      const cachedData = cacheUtil.get(cacheKey);
      if (cachedData) {
        // this.logger.debug("Using cached game list data");
        return {
          success: true,
          message: "Game list retrieved from cache",
          data: cachedData,
        };
      }
      if (!tid) {
        tid = this.generateTid("GAMES_");
      }

      const hash = this.generateGameListHash(tid);
      // Build URL
      const queryParams = new URLSearchParams({
        TID: tid,
        Hash: hash,
      });

      const url = `${this.endUrl}/System/Api/${this.apiKey}/Game/List/?&${queryParams.toString()}`;
      const response = await axios.get(url);

      if (typeof response.data === "object") {
        const restrictions = await RestrictedCountryModel.find();

        // Convert restrictions to a lookup object { merchantId: bannedCountries[] }
        const bannedLookup = {};
        restrictions.forEach((entry) => {
          bannedLookup[entry.merchantId] = entry.bannedCountries || [];
        });
        const filteredGames = response.data.filter((game) => {
          const merchantId = game.System;
          return !bannedLookup[merchantId]?.includes("ind");
        });

        cacheUtil.set(cacheKey, filteredGames, 3600 * 12);

        return {
          success: true,
          message: "Game list retrieved successfully",
          data: filteredGames,
        };
      }

      throw new Error("Invalid response format");
    } catch (error) {
      this.logger.error("Error getting game list:", error);
      return {
        success: false,
        message: error.message || "Failed to retrieve game list",
        data: null,
        // data: this.formatResponse(false, null, error.message)
      };
    }
  }

  //
  /**
   * Synchronize games from Fundist to our database
   */
  public async syncGames(): Promise<ServiceResponse> {
    try {
      // Fetch games from Fundist
      const gamesResponse = await this.getGameFullList();

      if (!gamesResponse.success || !gamesResponse.data?.games?.length) {
        return {
          success: false,
          message: "Failed to retrieve games from Fundist",
          data: null,
        };
      }

      const games = gamesResponse.data.games;
      const bulkOps = [];

      // Prepare bulk operations for all games
      for (const game of games) {
        try {
          // Map the game data to our model structure
          const gameData = {
            gameId: game.ID,
            name: game.Name,
            image: game.Image,
            imageFullPath: game.ImageFullPath,
            url: game.Url,
            mobileUrl: game.MobileUrl,
            description: game.Description || {},
            branded: game.Branded,
            hasDemo: game.hasDemo,
            categoryIds: game.CategoryID,
            merchantId: game.MerchantID,
            subMerchantId: game.SubMerchantID,
            aspectRatio: game.AR,
            pageCode: game.PageCode,
            isVirtual: game.IsVirtual,
            tableId: game.TableID,
            rtp: game.RTP || "",
            minBetDefault: game.MinBetDefault || "",
            maxBetDefault: game.MaxBetDefault || "",
            maxMultiplier: game.MaxMultiplier || "",
            freeround: game.Freeround || "",
            bonusBuy: game.BonusBuy || 0,
            megaways: game.Megaways || 0,
            freespins: game.Freespins || 0,
            freeBonus: game.FreeBonus || 0,
            lastSync: new Date(),
          };

          // Add updateOne operation to bulkOps array
          bulkOps.push({
            updateOne: {
              filter: { gameId: game.ID },
              update: { $set: gameData },
              upsert: true,
            },
          });
        } catch (error) {
          this.logger.error(
            `Failed to prepare game ${game.ID} for bulk operation:`,
            error
          );
        }
      }

      // Execute the bulk operation
      const result = await FundistGameModel.bulkWrite(bulkOps);

      return {
        success: true,
        message: `Successfully synced games via bulk operation`,
        data: {
          totalGames: games.length,
          matchedCount: result.matchedCount,
          modifiedCount: result.modifiedCount,
          upsertedCount: result.upsertedCount,
          timestamp: new Date(),
        },
      };
    } catch (error) {
      this.logger.error("Error syncing games:", error);
      return {
        success: false,
        message: error.message || "Failed to sync games",
        data: null,
      };
    }
  }

  /**
   * Get casino transactions with game details using gameDesc for filtering
   */
  public async getCasinoTransactions(
    options: {
      startDate?: Date;
      endDate?: Date;
      userId?: string;
      limit?: number;
      page?: number;
      status?: string;
      categoryId?: string;
      merchantId?: string;
      gameId?: string;
      gameDesc?: string; // Added filter by gameDesc
    } = {}
  ): Promise<ServiceResponse> {
    try {
      const {
        startDate,
        endDate,
        userId,
        limit = 50,
        page = 0,
        status = "COMPLETED",
        categoryId,
        merchantId,
        gameDesc,
      } = options;

      console.log({
        startDate,
        endDate,
        userId,
        limit,
        page,
        status,
        categoryId,
        merchantId,
        gameDesc,
      })

      // Build query for transactions
      const query: any = {
        "metadata.fundistId": { $exists: true, $ne: null },
      };

      // Use gameDesc for more precise filtering if provided
      if (gameDesc) {
        query["metadata.gameDesc"] = gameDesc;
      } else {
        // Default fallback to ensure we have a gameId to work with
        query["metadata.gameId"] = { $exists: true, $ne: null };
      }

      if (status) {
        query.status = status;
      }

      if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) query.timestamp.$gte = startDate;
        if (endDate) query.timestamp.$lte = endDate;
      }

      if (userId) {
        const walletId = await WalletModel.findOne({userId})
        query.walletId = walletId._id
      }

      // Get total count for pagination
      const totalCount = await TransactionModel.countDocuments(query);

      // Fetch the transactions
      const transactions = await TransactionModel.find(query)
        .sort({ timestamp: -1 })
        .skip(page * limit)
        .limit(limit)
        .lean();

      // const gameList = [];
      const uniqueList = new Set()
      transactions.forEach((t) => {
        const gameDescValue = t.metadata?.gameDesc;
        if (gameDescValue) {
          if (!uniqueList.has(gameDescValue)) {
            uniqueList.add(gameDescValue);
          }
        }
      });
      const gameList = Array.from(uniqueList).map((game: string) => {
        const parts = game.split(":");
        const systemId = parts[0];
        const pageCode = parts.length > 1 ? parts[1] : null;
        return { merchantId: systemId, pageCode };
      })


      // games will have unique combination of merchantId and pageCode which is stored in gameList array

      // Build game query using gameId (not merchantId)
      const gameQuery: any = {
        merchantId: { $in: gameList.map((game) => game.merchantId) },
        pageCode: { $in: gameList.map((game) => game.pageCode) },
      };

      // Add optional filters for games
      if (categoryId) {
        gameQuery.categoryIds = categoryId;
      }

      if (merchantId) {
        gameQuery.merchantId = merchantId;
      }
      console.log(JSON.stringify({ gameQuery }, null, 2));

      // Fetch all games in one query with selected fields (include pageCode now)
      const games = await FundistGameModel.find(gameQuery)
        .select(
          "gameId name imageFullPath rtp merchantId categoryIds hasDemo bonusBuy megaways freespins pageCode"
        )
        .lean();
        console.log({games})
      // Create lookup map for quick access by gameId and pageCode combination
      const gamesMap: Record<string, IFundistGame> = {};
      const gamesByIdMap: Record<string, IFundistGame[]> = {};

      games.forEach((game) => {
        // Create a composite key using gameId:pageCode for exact matching
        const compositeKey = `${game.merchantId}:${game.pageCode || ""}`;
        gamesMap[compositeKey] = game;

        // Also group games by gameId for fallback
        if (!gamesByIdMap[game.merchantId]) {
          gamesByIdMap[game.merchantId] = [];
        }
        gamesByIdMap[game.merchantId].push(game);
      });

      // Enhance transactions with game details
      const enhancedTransactions = transactions.map((transaction) => {
        // Extract gameId and subtype from gameDesc or fall back to gameId field
        let gameId, subtype;

        if (transaction.metadata?.gameDesc) {
          const parts = transaction.metadata.gameDesc.split(":");
          gameId = parts[0];
          subtype = parts.length > 1 ? parts[1] : null;
        } else {
          gameId = transaction.metadata?.gameId;
          subtype = transaction.metadata?.subtype;
        }

        // Try to get game using the exact composite key first
        const compositeKey = `${gameId}:${subtype || ""}`;
        let game = gamesMap[compositeKey];

        // If not found with the exact match, try to find by gameId only
        if (!game && gamesByIdMap[gameId] && gamesByIdMap[gameId].length > 0) {
          game = gamesByIdMap[gameId][0]; // Use the first matching game as fallback
        }

        return {
          ...transaction,
          game: game
            ? {
                id: game.gameId,
                name: game.name.en || Object.values(game.name)[0],
                image: game.imageFullPath,
                rtp: game.rtp,
                merchantId: game.merchantId,
                categories: game.categoryIds,
                subtype: subtype, // Add subtype from gameDesc
                gameDesc: transaction.metadata?.gameDesc, // Include the original gameDesc
                features: {
                  hasDemo: game.hasDemo,
                  bonusBuy: game.bonusBuy,
                  megaways: game.megaways,
                  freespins: game.freespins,
                },
              }
            : null,
        };
      });

      // If category/merchant filtering applied after the transaction query,
      // filter transactions with games that match the criteria
      let filteredTransactions = enhancedTransactions;
      if ((categoryId || merchantId) && !gameDesc) {
        filteredTransactions = enhancedTransactions.filter(
          (t) => t.game !== null
        );
      }

      return {
        success: true,
        message: "Casino transactions retrieved successfully",
        data: {
          transactions: filteredTransactions,
          pagination: {
            total: totalCount,
            limit,
            page,
            filteredCount: filteredTransactions.length,
          },
        },
      };
    } catch (error) {
      this.logger.error("Error retrieving casino transactions:", error);
      return {
        success: false,
        message: error.message || "Failed to retrieve casino transactions",
        data: null,
      };
    }
  }

  /**
   * Get detailed information about a specific game including transaction history
   * @param gameIdOrDesc Either the gameId or a gameDesc (format: gameId:subtype)
   * @param userId Optional user ID to filter transaction history
   * @param limit Max number of transactions to return
   * @param includeSubtypes Whether to group transactions by subtype
   */
  public async getGameDetails(
    gameIdOrDesc: string,
    userId?: string,
    limit: number = 10,
    includeSubtypes: boolean = false
  ): Promise<ServiceResponse> {
    try {
      // Extract gameId from gameDesc if it's in that format
      let gameId = gameIdOrDesc;
      let subtypeFilter = null;

      if (gameIdOrDesc.includes(":")) {
        const parts = gameIdOrDesc.split(":");
        gameId = parts[0];
        if (parts.length > 1) {
          subtypeFilter = parts[1];
        }
      }

      // Query to find game, we need to consider the pageCode (subtype) when provided
      const gameQuery: any = { gameId };

      // If we have a subtype, and it's a pageCode, add it to the query
      if (subtypeFilter) {
        gameQuery.pageCode = subtypeFilter;
      }

      // Get game details
      const game = await FundistGameModel.findOne(gameQuery).lean();

      if (!game) {
        return {
          success: false,
          message: "Game not found",
          data: null,
        };
      }

      // Build transaction query
      const txQuery: any = {
        "metadata.fundistId": { $exists: true, $ne: null },
      };

      // Search by gameDesc starting with gameId
      txQuery["metadata.gameDesc"] = new RegExp(`^${gameId}:`, "i");

      // If specific subtype requested, filter for it
      if (subtypeFilter) {
        txQuery["metadata.gameDesc"] = `${gameId}:${subtypeFilter}`;
      }

      if (userId) {
        txQuery.userId = userId;
      }

      // Get recent transactions for this game
      const transactions = await TransactionModel.find(txQuery)
        .sort({ timestamp: -1 })
        .limit(limit)
        .lean();

      // Get all categories for the game
      let categories = [];
      if (game.categoryIds && game.categoryIds.length > 0) {
        // This assumes you have cached category data or a local collection
        const categoriesResponse = await this.getCategories();
        if (categoriesResponse.success && categoriesResponse.data) {
          const allCategories = categoriesResponse.data;
          categories = allCategories.filter((cat) =>
            game.categoryIds.includes(cat.id)
          );
        }
      }

      // Group transactions by subtype if requested
      let transactionsData;
      if (includeSubtypes) {
        // Create a map of subtypes to transactions
        const subtypeMap: Record<string, any[]> = {};

        transactions.forEach((tx) => {
          let subtype = "default";
          if (tx.metadata?.gameDesc) {
            const parts = tx.metadata.gameDesc.split(":");
            if (parts.length > 1) {
              subtype = parts[1];
            }
          }

          if (!subtypeMap[subtype]) {
            subtypeMap[subtype] = [];
          }

          subtypeMap[subtype].push({
            id: tx._id,
            amount: tx.amount,
            type: tx.type,
            timestamp: tx.timestamp,
            status: tx.status,
            currency: tx.currency,
            gameDesc: tx.metadata?.gameDesc,
          });
        });

        transactionsData = {
          bySubtype: subtypeMap,
          total: transactions.length,
        };
      } else {
        // Just return the transactions array
        transactionsData = transactions.map((tx) => ({
          id: tx._id,
          amount: tx.amount,
          type: tx.type,
          timestamp: tx.timestamp,
          status: tx.status,
          currency: tx.currency,
          gameDesc: tx.metadata?.gameDesc,
        }));
      }

      // Format the response
      const formattedGame = {
        id: game.gameId,
        name: game.name.en || Object.values(game.name)[0],
        description:
          game.description.en || Object.values(game.description)[0] || "",
        image: game.imageFullPath,
        url: game.url,
        mobileUrl: game.mobileUrl,
        rtp: game.rtp,
        merchantId: game.merchantId,
        categories,
        features: {
          hasDemo: game.hasDemo,
          bonusBuy: game.bonusBuy,
          megaways: game.megaways,
          freespins: game.freespins,
          freeBonus: game.freeBonus,
        },
        bettingLimits: {
          min: game.minBetDefault,
          max: game.maxBetDefault,
          maxMultiplier: game.maxMultiplier,
        },
        recentTransactions: transactionsData,
      };

      return {
        success: true,
        message: "Game details retrieved successfully",
        data: formattedGame,
      };
    } catch (error) {
      this.logger.error("Error retrieving game details:", error);
      return {
        success: false,
        message: error.message || "Failed to retrieve game details",
        data: null,
      };
    }
  }
}
