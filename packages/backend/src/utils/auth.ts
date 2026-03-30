import jwt from "jsonwebtoken";
const JWT_SECRET = process.env.JWT_SECRET || "change-me";
export interface AuthPayload { userId: string; email: string; }
export const signToken = (payload: AuthPayload): string => jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
export const verifyToken = (token: string): AuthPayload => jwt.verify(token, JWT_SECRET) as AuthPayload;
export const parseBearerToken = (headerValue?: string): string => {
  if (!headerValue) throw new Error("No token provided");
  const normalized = headerValue.trim();
  if (!normalized.toLowerCase().startsWith("bearer ")) throw new Error("Invalid authorization header");
  return normalized.slice(7).trim();
};
