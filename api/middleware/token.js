import { checkToken } from "../functions/token.js";
import {
  invalidToken,
  expiredToken,
  tokenNotProvided,
} from "../handlers/token.js";

export function getAccessToken(req, res, next) {
  try {
    let token = req.headers["authorization"];
    if (!token) {
      return tokenNotProvided(req, res);
    }
    let tokenPayload = checkToken(token);
    if (tokenPayload.type !== "access") {
      return invalidToken(req, res);
    }
    req.username = tokenPayload.username;
    next();
  } catch (error) {
    if (error.name == "JsonWebTokenError") {
      return invalidToken(req, res);
    } else if (error.name == "TokenExpiredError") {
      return expiredToken(req, res);
    }
    next(error);
  }
}

export function getRefreshToken(req, res, next) {
  try {
    let token = req.cookies["refreshToken"];
    if (!token) {
      return tokenNotProvided(req, res);
    }
    let tokenPayload = checkToken(token);
    if (tokenPayload.type !== "refresh") {
      return invalidToken(req, res);
    }
    req.username = tokenPayload.username;
    req.sid = tokenPayload.sid;
    next();
  } catch (error) {
    if (error.name == "JsonWebTokenError") {
      return invalidToken(req, res);
    } else if (error.name == "TokenExpiredError") {
      return expiredToken(req, res);
    }
    next(error);
  }
}
