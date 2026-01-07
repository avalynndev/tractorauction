import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

export function generateToken(userId: string, phoneNumber: string): string {
  return jwt.sign({ userId, phoneNumber }, JWT_SECRET, {
    expiresIn: "30d",
  });
}

export function verifyToken(token: string): { userId: string; phoneNumber: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; phoneNumber: string };
  } catch {
    return null;
  }
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function comparePassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}






























