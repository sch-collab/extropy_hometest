export interface User { userId: string; email: string; passwordHash: string; createdAt: string; updatedAt: string; }
export interface Expense { expenseId: string; userId: string; amount: number; description: string; categoryId: string; date: string; expenseDate: string; createdAt: string; updatedAt: string; }
export interface Category { categoryId: string; userId: string; name: string; isDefault: boolean; createdAt: string; }
