import jwt from "jsonwebtoken";
import supabase from "../config/supabase.js";
import ApiError from "../utils/ApiError.js";
import { verifyAccessToken } from "../utils/authTokens.js";

export async function requireAuth(req, _res, next) {
  const authorization = req.get("authorization");
  const [scheme, token, ...extra] = authorization?.split(" ") ?? [];

  if (scheme !== "Bearer" || !token || extra.length > 0) {
    return next(new ApiError(401, "A bearer access token is required"));
  }

  let claims;
  try {
    claims = verifyAccessToken(token);
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new ApiError(401, "Access token is invalid or expired"));
    }
    return next(error);
  }

  if (
    typeof claims === "string" ||
    claims.type !== "access" ||
    typeof claims.sub !== "string"
  ) {
    return next(new ApiError(401, "Access token is invalid"));
  }

  const { data: user, error } = await supabase
    .from("users")
    .select("id, name, email, role, department_id, is_active")
    .eq("id", claims.sub)
    .maybeSingle();

  if (error) {
    console.error("Supabase authenticated user lookup failed:", error.message);
    return next(new ApiError(500, "An unexpected database error occurred"));
  }
  if (!user?.is_active) {
    return next(new ApiError(401, "The account is unavailable"));
  }

  req.user = user;
  return next();
}
