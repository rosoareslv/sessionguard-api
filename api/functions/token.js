import jwt from "jsonwebtoken";
import crypto from "crypto";

export function createTokens(
  username,
  { accessTokenExpiresIn = "10m", sid = null } = {},
) {
  try {
    let accessToken = jwt.sign(
      { username: username, jti: crypto.randomUUID(), type: "access" },
      process.env.PRIVATE_KEY,
      {
        algorithm: "RS256",
        expiresIn: accessTokenExpiresIn,
      },
    );
    let sessionId = sid ?? crypto.randomUUID();
    let refreshToken = jwt.sign(
      {
        username: username,
        jti: crypto.randomUUID(),
        sid: sessionId,
        type: "refresh",
      },
      process.env.PRIVATE_KEY,
      {
        algorithm: "RS256",
        expiresIn: "1d",
      },
    );
    return { accessToken, refreshToken, sessionId };
  } catch (error) {
    throw error;
  }
}

export function checkToken(token) {
  try {
    return jwt.verify(token.replace("Bearer ", ""), process.env.PUBLIC_KEY, {
      algorithms: ["RS256"],
    });
  } catch (error) {
    throw error;
  }
}
