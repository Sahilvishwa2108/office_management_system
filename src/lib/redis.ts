import Redis from "ioredis";

const redisOptions = {
  maxRetriesPerRequest: 2, 
  enableReadyCheck: false, 
  tls: { rejectUnauthorized: false }, 
  reconnectOnError: (err: Error) => {
    console.error("❌ Redis Error:", err.message);
    return true;
  },
};

// Main Redis instance
export const redis = new Redis(process.env.REDIS_URL as string, redisOptions);

// Publisher
export const pubRedis = new Redis(process.env.REDIS_URL as string, redisOptions);

// Subscriber
export const subRedis = new Redis(process.env.REDIS_URL as string, redisOptions);

// Handle connection errors for all Redis clients
[redis, pubRedis, subRedis].forEach((client, index) => {
  const name = ["Main", "Pub", "Sub"][index];

  client.on("error", (err) => console.error(`❌ ${name} Redis Error:`, err));
  client.on("end", () => console.warn(`⚠ ${name} Redis connection ended. Reconnecting...`));
  client.on("close", () => console.warn(`⚠ ${name} Redis connection closed. Reconnecting...`));
});
