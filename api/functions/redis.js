import { createClient } from "redis";

const redisClient = createClient({
  url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
});

redisClient.on("error", (err) => console.error(`Redis error: ${err}`));
redisClient.on("end", () => console.log("Redis disconnected"));
redisClient.on("ready", () => console.log("Redis OK"));

await redisClient.connect();

export default redisClient;
