import { parseBearerToken, signToken, verifyToken } from "../utils/auth";
describe("auth utils", () => {
  it("signs and verifies token payload", () => {
    const token = signToken({ userId: "u1", email: "a@b.com" });
    const payload = verifyToken(token);
    expect(payload.userId).toBe("u1");
    expect(payload.email).toBe("a@b.com");
  });
  it("parses bearer token", () => {
    expect(parseBearerToken("Bearer abc")).toBe("abc");
    expect(parseBearerToken("bearer xyz")).toBe("xyz");
  });
});
