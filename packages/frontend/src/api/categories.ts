import { api } from "./client";
import { Category } from "../types";
export const getCategories = async () => (await api.get<Category[]>("/categories")).data;
export const createCategory = async (name: string) => (await api.post<Category>("/categories", { name })).data;
export const deleteCategory = async (id: string) => { await api.delete(`/categories/${id}`); };
