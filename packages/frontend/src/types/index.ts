export interface AuthResponse { userId: string; token: string; }
export interface Category { categoryId: string; userId: string; name: string; isDefault: boolean; createdAt: string; }
export interface Expense { expenseId: string; userId: string; amount: number; description: string; categoryId: string; date: string; createdAt: string; updatedAt: string; }
export interface ReportSummary { month: string; total: number; byCategory: Array<{ categoryId: string; total: number }>; }
