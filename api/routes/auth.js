import express from "express";
import { create, login, refresh, logout } from "../controller/auth.js";
import { getRefreshToken, getAccessToken } from "../middleware/token.js";

const router = express.Router();

router.post("/register", create);
router.post("/login", login);
router.get("/refresh", getRefreshToken, refresh);
router.get("/logout", getRefreshToken, logout);

export default router;
