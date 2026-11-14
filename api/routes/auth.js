import express from "express";
import { create, login, refresh, logout } from "../controller/auth.js";
import { rateLimiter } from "../functions/rateLimiter.js";
import { getRefreshToken } from "../middleware/token.js";

const router = express.Router();

let windowMs = null;
let limit = null;
let prefix = "rl:login:";

if (process.env.NODE_ENV === "test") {
  windowMs = 1 * 60 * 1000; // 1 minutes
  limit = 100;
} else {
  windowMs = 15 * 60 * 1000; // 15 minutes
  limit = 5;
}

const loginRateLimiter = rateLimiter(windowMs, limit, prefix);

router.post("/register", create);
router.post("/login", loginRateLimiter, login);
router.post("/refresh", getRefreshToken, refresh);
router.post("/logout", getRefreshToken, logout);

export default router;
