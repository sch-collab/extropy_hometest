import { ReportService } from "../services/ReportService";
import { ExpenseService } from "../services/ExpenseService";
jest.mock("../services/ExpenseService");
describe("ReportService", () => {
  it("aggregates totals by category", async () => {
    const mocked = ExpenseService as jest.MockedClass<typeof ExpenseService>;
    mocked.prototype.getExpenses = jest.fn().mockResolvedValue([
      { expenseId: "e1", userId: "u1", amount: 20, description: "Lunch", categoryId: "food", date: "2026-03-10", expenseDate: "2026-03-10", createdAt: "", updatedAt: "" },
      { expenseId: "e2", userId: "u1", amount: 80, description: "Taxi", categoryId: "transport", date: "2026-03-11", expenseDate: "2026-03-11", createdAt: "", updatedAt: "" },
      { expenseId: "e3", userId: "u1", amount: 10, description: "Snack", categoryId: "food", date: "2026-03-12", expenseDate: "2026-03-12", createdAt: "", updatedAt: "" },
    ] as any);
    const service = new ReportService();
    const result = await service.getMonthlySummary("u1", "2026-03");
    expect(result.total).toBe(110);
    expect(result.byCategory).toEqual([{ categoryId: "transport", total: 80 }, { categoryId: "food", total: 30 }]);
  });
});
