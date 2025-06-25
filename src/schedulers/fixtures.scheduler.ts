// import { RedisClientOptions } from "redis";

// // scheduler.js
// const { PriorityQueue } = require("bull");
// const redis = require("redis");

// class FixtureScheduler {
//     private redisClient: redis.RedisClientType<RedisClientOptions, any, any>;
//   // Queue instance
//   queue;

//   constructor() {
//     this.redisClient = redis.createClient();
//     this.queue = new PriorityQueue("fixture-polling", {
//       redis: { client: this.redisClient },
//       defaultJobOptions: {
//         removeOnComplete: true,
//         attempts: 3,
//         backoff: { type: "exponential" },
//       },
//     });
//   }

//   async scheduleFixture(fixtureId, sportType, status) {
//     const priority = this.calculatePriority(sportType, status);
//     const delay = this.calculateDelay(status);

//     await this.queue.add(
//       { fixtureId, sportType },
//       {
//         priority,
//         delay,
//         jobId: `${sportType}:${fixtureId}`,
//       }
//     );
//   }

//   calculatePriority(sportType, status) {
//     const config = SPORTS_CONFIG[sportType];
//     return config.priority * (status === "inplay" ? 3 : 1);
//   }

//   calculateDelay(status) {
//     const intervals = {
//       inplay: 10000,
//       upcoming: 30000,
//       ended: 60000,
//     };
//     return intervals[status] || 30000;
//   }
// }


