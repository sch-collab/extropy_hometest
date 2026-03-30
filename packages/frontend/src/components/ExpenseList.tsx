import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import { Expense, Category } from "../types";
import { buildExpensesCsv, downloadCsv } from "../utils/exportExpensesCsv";
interface Props { expenses: Expense[]; categories: Category[]; onDelete: (expenseId: string) => Promise<void>; }
export default function ExpenseList({ expenses, categories, onDelete }: Props) {
  const categoryName = (id: string) => categories.find((c) => c.categoryId === id)?.name || "Unknown";
  const exportCsv = () => {
    const stamp = new Date().toISOString().slice(0, 10);
    downloadCsv(`expenses-${stamp}.csv`, buildExpensesCsv(expenses, categories));
  };
  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 1, mb: 2 }}>
        <Typography variant="h6">Expenses</Typography>
        <Button variant="outlined" size="small" onClick={exportCsv} disabled={expenses.length === 0}>
          Export CSV
        </Button>
      </Box>
      <Stack spacing={1}>
        {expenses.map((e) => (
          <Stack key={e.expenseId} direction="row" justifyContent="space-between" alignItems="center" sx={{ borderBottom: "1px solid #eee", pb: 1 }}>
            <Typography>{e.date} - {categoryName(e.categoryId)} - ${e.amount.toFixed(2)} - {e.description}</Typography>
            <Button color="error" onClick={() => onDelete(e.expenseId)}>Delete</Button>
          </Stack>
        ))}
        {expenses.length === 0 && <Typography color="text.secondary">No expenses yet.</Typography>}
      </Stack>
    </Paper>
  );
}
