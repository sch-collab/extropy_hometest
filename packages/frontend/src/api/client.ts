import axios from "axios";
import { useAuthStore } from "../state/auth";
const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/dev";
export const api = axios.create({ baseURL });
api.interceptors.request.use((config) => { const token = useAuthStore.getState().token; if (token) config.headers.Authorization = `Bearer ${token}`; return config; });
