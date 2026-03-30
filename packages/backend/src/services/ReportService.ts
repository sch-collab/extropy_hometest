import { ExpenseService } from "./ExpenseService";
export class ReportService {
  private expenseService = new ExpenseService();
  async getMonthlySummary(userId: string, month: string): Promise<{ month: string; total: number; byCategory: Array<{ categoryId: string; total: number }> }> {
    const expenses = await this.expenseService.getExpenses(userId, `${month}-01`, `${month}-31`);
    const map = new Map<string, number>();
    for (const e of expenses) map.set(e.categoryId, (map.get(e.categoryId) || 0) + e.amount);
    return { month, total: expenses.reduce((sum, item) => sum + item.amount, 0), byCategory: Array.from(map.entries()).map(([categoryId, total]) => ({ categoryId, total })).sort((a, b) => b.total - a.total) };
  }
}
