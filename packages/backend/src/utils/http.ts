import { APIGatewayProxyResult } from "aws-lambda";
const headers = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" };
export const json = (statusCode: number, body: unknown): APIGatewayProxyResult => ({ statusCode, headers, body: JSON.stringify(body) });
export const noContent = (): APIGatewayProxyResult => ({ statusCode: 204, headers: { "Access-Control-Allow-Origin": "*" }, body: "" });
