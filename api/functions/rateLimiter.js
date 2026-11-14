import rateLimit from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import redisClient from "../functions/redis.js";

export function rateLimiter(windowMs, limit, prefix) {
  return rateLimit({
    windowMs: windowMs,
    limit: limit,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    message: { message: "Too many login attempts, please try again later" },
    statusCode: 429,
    headers: {
      "Content-Type": "application/json",
      "Retry-After": windowMs,
    },
    store: new RedisStore({
      sendCommand: (...args) => redisClient.sendCommand(args),
      prefix: prefix,
    }),
  });
}
