import { DeleteCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";
import { Category } from "../models/types";
import { docClient } from "./dynamo";
const CATEGORIES_TABLE = process.env.CATEGORIES_TABLE || "Categories";
const DEFAULT_CATEGORIES = ["Food", "Transport", "Entertainment", "Shopping", "Health", "Bills", "Education", "Other"];
export class CategoryService {
  async createCategory(userId: string, name: string, isDefault = false): Promise<Category> {
    const category: Category = { categoryId: randomUUID(), userId, name, isDefault, createdAt: new Date().toISOString() };
    await docClient.send(new PutCommand({ TableName: CATEGORIES_TABLE, Item: category }));
    return category;
  }
  async getCategories(userId: string): Promise<Category[]> {
    const result = await docClient.send(new QueryCommand({ TableName: CATEGORIES_TABLE, KeyConditionExpression: "userId = :userId", ExpressionAttributeValues: { ":userId": userId } }));
    return (result.Items as Category[]) || [];
  }
  async deleteCategory(userId: string, categoryId: string): Promise<void> {
    await docClient.send(new DeleteCommand({ TableName: CATEGORIES_TABLE, Key: { userId, categoryId } }));
  }
  async seedDefaultCategories(userId: string): Promise<void> {
    await Promise.all(DEFAULT_CATEGORIES.map((name) => this.createCategory(userId, name, true)));
  }
}
