import { jwtExpires, jwtSecret } from "@config/constants";
import jwt from "jsonwebtoken";

interface TokenPayload {
  userId?: string;
  role?: string;
  [key: string]: any;
}

/**
 * Generates a JWT token
 * @param payload - Data to be encoded in the token
 * @param expiresIn - Token expiration time (e.g., '1h', '1d', '7d')
 * @returns string - JWT token
 */
export const generateToken = (
  payload: TokenPayload,
  expiresIn: string = jwtExpires
): string => {
  return jwt.sign(payload, jwtSecret, {
    expiresIn,
    algorithm: "HS256",
  });
};

/**
 * Verifies a JWT token
 * @param token - Token to verify
 * @returns TokenPayload | null
 */
export const verifyToken = (token: string): TokenPayload | null => {
  try {
    return jwt.verify(token, jwtSecret) as TokenPayload;
  } catch (error) {
    return null;
  }
};
