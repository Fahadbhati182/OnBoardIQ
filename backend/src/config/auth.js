const accessTokenSecret = process.env.JWT_ACCESS_SECRET;
const refreshTokenSecret = process.env.JWT_REFRESH_SECRET;

if (!accessTokenSecret || accessTokenSecret.length < 32) {
  throw new Error("JWT_ACCESS_SECRET must be set and at least 32 characters long");
}

if (!refreshTokenSecret || refreshTokenSecret.length < 32) {
  throw new Error("JWT_REFRESH_SECRET must be set and at least 32 characters long");
}

export const ACCESS_TOKEN_TTL = "15m";
export const REFRESH_TOKEN_TTL = "7d";
export const REFRESH_TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
export const REFRESH_COOKIE_NAME = "refreshToken";

export { accessTokenSecret, refreshTokenSecret };
