import { DeleteCommand, PutCommand, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";
import { Expense } from "../models/types";
import { docClient } from "./dynamo";
const EXPENSES_TABLE = process.env.EXPENSES_TABLE || "Expenses";
interface CreateExpenseInput { amount: number; description: string; categoryId: string; date: string; }
export class ExpenseService {
  async createExpense(userId: string, input: CreateExpenseInput): Promise<Expense> {
    const now = new Date().toISOString();
    const expense: Expense = { expenseId: randomUUID(), userId, amount: input.amount, description: input.description, categoryId: input.categoryId, date: input.date, expenseDate: input.date, createdAt: now, updatedAt: now };
    await docClient.send(new PutCommand({ TableName: EXPENSES_TABLE, Item: expense }));
    return expense;
  }
  async getExpenses(userId: string, startDate?: string, endDate?: string, categoryId?: string): Promise<Expense[]> {
    const hasRange = Boolean(startDate && endDate);
    const result = await docClient.send(new QueryCommand(hasRange ? { TableName: EXPENSES_TABLE, IndexName: "UserDateIndex", KeyConditionExpression: "userId = :userId AND expenseDate BETWEEN :startDate AND :endDate", ExpressionAttributeValues: { ":userId": userId, ":startDate": startDate, ":endDate": endDate } } : { TableName: EXPENSES_TABLE, KeyConditionExpression: "userId = :userId", ExpressionAttributeValues: { ":userId": userId } }));
    let items = (result.Items as Expense[]) || [];
    if (categoryId) items = items.filter((x) => x.categoryId === categoryId);
    return items.sort((a,b)=>new Date(b.date).getTime()-new Date(a.date).getTime());
  }
  async updateExpense(userId: string, expenseId: string, updates: Partial<Omit<Expense, "expenseId"|"userId"|"createdAt">>): Promise<Expense> {
    const safeUpdates = { ...updates };
    if (safeUpdates.date) safeUpdates.expenseDate = safeUpdates.date;
    const entries = Object.entries(safeUpdates).filter(([,v])=>v!==undefined);
    if (!entries.length) throw new Error("No update fields provided");
    const names: Record<string,string> = { "#updatedAt": "updatedAt" };
    const values: Record<string,unknown> = { ":updatedAt": new Date().toISOString() };
    const setParts = ["#updatedAt = :updatedAt"];
    for (const [key,value] of entries) { names[`#${key}`]=key; values[`:${key}`]=value; setParts.push(`#${key} = :${key}`); }
    const result = await docClient.send(new UpdateCommand({ TableName: EXPENSES_TABLE, Key: { userId, expenseId }, ConditionExpression: "attribute_exists(expenseId)", UpdateExpression: `SET ${setParts.join(", ")}`, ExpressionAttributeNames: names, ExpressionAttributeValues: values, ReturnValues: "ALL_NEW" }));
    return result.Attributes as Expense;
  }
  async deleteExpense(userId: string, expenseId: string): Promise<void> { await docClient.send(new DeleteCommand({ TableName: EXPENSES_TABLE, Key: { userId, expenseId } })); }
}
