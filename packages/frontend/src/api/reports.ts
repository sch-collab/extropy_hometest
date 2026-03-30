import { api } from "./client";
import { ReportSummary } from "../types";
export const getReportSummary = async (month: string) => (await api.get<ReportSummary>("/reports/summary", { params: { month } })).data;
