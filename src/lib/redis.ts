// import Redis from "ioredis";

// export const redis = new Redis(process.env.REDIS_URL as string, {
//   tls: { rejectUnauthorized: false },
// });

// export const pubSubRedis = new Redis(process.env.REDIS_URL as string, {
//   tls: { rejectUnauthorized: false },
// });



import Redis from "ioredis";

const redisOptions = {
  maxRetriesPerRequest: 2, // 🔹 Prevent excessive retries
  enableReadyCheck: false, // 🔹 Allow faster failover if Redis is unavailable
  tls: { rejectUnauthorized: false }, // 🔹 Required for Aiven Redis (apply to all instances)
  reconnectOnError: (err: Error) => {
    console.error("❌ Redis Error:", err.message);
    return true; // 🔹 Attempt to reconnect
  },
};

// Main Redis instance
export const redis = new Redis(process.env.REDIS_URL as string, redisOptions);

// Publisher
export const pubRedis = new Redis(process.env.REDIS_URL as string, redisOptions);

// Subscriber
export const subRedis = new Redis(process.env.REDIS_URL as string, redisOptions);

// ✅ Handle connection errors for all Redis clients
[redis, pubRedis, subRedis].forEach((client, index) => {
  const name = ["Main", "Pub", "Sub"][index]; // Label for logs
});
