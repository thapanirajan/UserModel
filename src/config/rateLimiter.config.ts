import { RateLimiterRedis } from "rate-limiter-flexible";
import Redis from "ioredis";

// Initialize Redis client
const redisClient = new Redis({
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379"),
    password: process.env.REDIS_PASSWORD,
    tls: process.env.NODE_ENV === "production" ? {} : undefined,
});

// Handle Redis errors
redisClient.on("error", (err) => console.error("Redis error:", err));

// Configure rate limiter for email resends
const emailResendLimiter = new RateLimiterRedis({
    storeClient: redisClient,
    points: 3, // Allow 3 attempts
    duration: 10 * 60, // 10 minutes
    keyPrefix: "resend-email",
});

export { emailResendLimiter };