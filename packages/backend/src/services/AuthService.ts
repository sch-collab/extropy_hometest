import bcrypt from "bcryptjs";
import { PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";
import { docClient } from "./dynamo";
import { User } from "../models/types";
import { signToken } from "../utils/auth";
import { CategoryService } from "./CategoryService";
const USERS_TABLE = process.env.USERS_TABLE || "Users";
export class AuthService {
  private categoryService = new CategoryService();
  private async getUserByEmail(email: string): Promise<User | null> {
    const result = await docClient.send(new QueryCommand({ TableName: USERS_TABLE, IndexName: "EmailIndex", KeyConditionExpression: "email = :email", ExpressionAttributeValues: { ":email": email }, Limit: 1 }));
    return (result.Items?.[0] as User) || null;
  }
  async signup(email: string, password: string): Promise<{ userId: string; token: string }> {
    const existing = await this.getUserByEmail(email);
    if (existing) throw new Error("User already exists");
    const userId = randomUUID();
    const now = new Date().toISOString();
    const passwordHash = await bcrypt.hash(password, 10);
    await docClient.send(new PutCommand({ TableName: USERS_TABLE, Item: { userId, email, passwordHash, createdAt: now, updatedAt: now } satisfies User }));
    await this.categoryService.seedDefaultCategories(userId);
    return { userId, token: signToken({ userId, email }) };
  }
  async login(email: string, password: string): Promise<{ userId: string; token: string }> {
    const user = await this.getUserByEmail(email);
    if (!user) throw new Error("Invalid credentials");
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new Error("Invalid credentials");
    return { userId: user.userId, token: signToken({ userId: user.userId, email: user.email }) };
  }
}
