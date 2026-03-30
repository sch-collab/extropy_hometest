import { api } from "./client";
import { AuthResponse } from "../types";
export const signup = async (email: string, password: string) => (await api.post<AuthResponse>("/auth/signup", { email, password })).data;
export const login = async (email: string, password: string) => (await api.post<AuthResponse>("/auth/login", { email, password })).data;
