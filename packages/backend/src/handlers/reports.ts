import "dotenv/config";
import { APIGatewayProxyHandler } from "aws-lambda";
import { getAuthContext } from "../middleware/auth";
import { ReportService } from "../services/ReportService";
import { json } from "../utils/http";
const service = new ReportService();
export const getReportSummary: APIGatewayProxyHandler = async (event) => {
  try {
    const user = getAuthContext(event);
    const month = event.queryStringParameters?.month;
    if (!month || !/^\d{4}-\d{2}$/.test(month)) return json(400, { error: "Query param month is required in format YYYY-MM" });
    return json(200, await service.getMonthlySummary(user.userId, month));
  } catch (error) {
    return json(401, { error: error instanceof Error ? error.message : "Failed to get report" });
  }
};
