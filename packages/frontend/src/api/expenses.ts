import { api } from "./client";
import { Expense } from "../types";
export const getExpenses = async (params?: { startDate?: string; endDate?: string; categoryId?: string }) => (await api.get<Expense[]>("/expenses", { params })).data;
export const createExpense = async (payload: { amount: number; description: string; categoryId: string; date: string }) => (await api.post<Expense>("/expenses", payload)).data;
export const updateExpense = async (id: string, payload: Partial<{ amount: number; description: string; categoryId: string; date: string }>) => (await api.put<Expense>(`/expenses/${id}`, payload)).data;
export const deleteExpense = async (id: string) => { await api.delete(`/expenses/${id}`); };
