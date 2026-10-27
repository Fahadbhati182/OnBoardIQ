import { randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import {
  ACCESS_TOKEN_TTL,
  REFRESH_TOKEN_TTL,
  accessTokenSecret,
  refreshTokenSecret,
} from "../config/auth.js";

const ISSUER = "onboardiq-api";

export function createAccessToken(user) {
  return jwt.sign(
    {
      type: "access",
      role: user.role,
    },
    accessTokenSecret,
    {
      subject: user.id,
      expiresIn: ACCESS_TOKEN_TTL,
      issuer: ISSUER,
    },
  );
}

export function createRefreshToken(userId, sessionId) {
  return jwt.sign(
    {
      type: "refresh",
      sid: sessionId,
    },
    refreshTokenSecret,
    {
      jwtid: randomUUID(),
      subject: userId,
      expiresIn: REFRESH_TOKEN_TTL,
      issuer: ISSUER,
    },
  );
}

export function verifyAccessToken(token) {
  return jwt.verify(token, accessTokenSecret, { issuer: ISSUER });
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, refreshTokenSecret, { issuer: ISSUER });
}
