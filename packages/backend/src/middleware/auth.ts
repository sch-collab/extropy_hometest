import { APIGatewayProxyEvent } from "aws-lambda";
import { parseBearerToken, verifyToken } from "../utils/auth";
export const getAuthContext = (event: APIGatewayProxyEvent) => {
  const token = parseBearerToken(event.headers.Authorization || event.headers.authorization);
  return verifyToken(token);
};
