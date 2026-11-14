import User from "../models/user.js";
import { generateHash, checkPassword } from "../functions/hash.js";
import { createTokens } from "../functions/token.js";
import {
  loginUserValidator,
  registerUserValidator,
} from "../functions/validators.js";
import { fieldValidationError } from "../handlers/validation.js";
import { client as redisClient } from "../functions/redis.js";

export async function create(req, res, next) {
  try {
    let validate = registerUserValidator.validate(req.body);
    if (validate.error != undefined) {
      res.validationMessage = validate.error.message;
      return fieldValidationError(req, res);
    }
    let username = await User.findOne({ username: req.body.username });
    if (username != null) {
      return res.status(409).json({
        message: "Unavailable username",
        username: req.body.username,
      });
    }
    req.body.password = await generateHash(req.body.password);
    await new User(req.body).save();
    return res.status(201).json({});
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    let validate = loginUserValidator.validate(req.body);
    if (validate.error != undefined) {
      res.validationMessage = validate.error.message;
      return fieldValidationError(req, res);
    }
    let user_db = await User.findOne({ username: req.body.username });
    if (user_db == null) {
      return res.status(401).json({
        message: "Not authorized",
      });
    }
    let is_user = await checkPassword(req.body.password, user_db.password);
    if (!is_user) {
      return res.status(401).json({ message: "Not authorized" });
    }
    let { accessToken, refreshToken, sessionId } = createTokens(
      req.body.username,
    );
    await redisClient.set(
      `refreshToken:${req.body.username}:${sessionId}`,
      refreshToken,
      {
        EX: 86400,
      },
    );
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "prod",
      maxAge: 86400000,
    });
    return res.status(200).json({
      accessToken,
    });
  } catch (error) {
    next(error);
  }
}

export async function logout(req, res, next) {
  try {
    await redisClient.del(`refreshToken:${req.username}:${req.sid}`);
    res.clearCookie("refreshToken");
    return res.status(200).json({ message: "Logged out" });
  } catch (error) {
    next(error);
  }
}

export async function refresh(req, res, next) {
  try {
    let latestRefreshToken = await redisClient.get(
      `refreshToken:${req.username}:${req.sid}`,
    );
    if (latestRefreshToken != req.cookies["refreshToken"]) {
      await redisClient.del(`refreshToken:${req.username}:${req.sid}`);
      return res.status(401).json({ message: "Not authorized" });
    }
    let { accessToken, refreshToken, _ } = createTokens(req.username, {
      sid: req.sid,
    });
    await redisClient.set(
      `refreshToken:${req.username}:${req.sid}`,
      refreshToken,
      {
        EX: 86400,
      },
    );
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "prod",
      maxAge: 86400000,
    });
    return res.status(200).json({ accessToken });
  } catch (error) {
    next(error);
  }
}
