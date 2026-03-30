import { useMemo, useState } from "react";
import { Alert, AppBar, Box, Button, Container, Grid, MenuItem, Stack, TextField, Toolbar, Typography } from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createCategory, getCategories } from "../api/categories";
import { createExpense, deleteExpense, getExpenses } from "../api/expenses";
import { getReportSummary } from "../api/reports";
import ExpenseForm from "../components/ExpenseForm";
import ExpenseList from "../components/ExpenseList";
import ReportPanel from "../components/ReportPanel";
import SpendingTrendsChart from "../components/SpendingTrendsChart";
import { useAuthStore } from "../state/auth";
export default function DashboardPage() {
  const queryClient = useQueryClient(); const navigate = useNavigate(); const logout = useAuthStore((s) => s.logout);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)); const [startDate, setStartDate] = useState(""); const [endDate, setEndDate] = useState(""); const [categoryFilter, setCategoryFilter] = useState(""); const [newCategory, setNewCategory] = useState("");
  const categoryQuery = useQuery({ queryKey: ["categories"], queryFn: getCategories });
  const expenseQuery = useQuery({ queryKey: ["expenses", startDate, endDate, categoryFilter], queryFn: () => getExpenses({ startDate: startDate || undefined, endDate: endDate || undefined, categoryId: categoryFilter || undefined }) });
  const reportQuery = useQuery({ queryKey: ["report", month], queryFn: () => getReportSummary(month) });
  const invalidateExpensesAndReports = () => {
    queryClient.invalidateQueries({ queryKey: ["expenses"] });
    queryClient.invalidateQueries({ queryKey: ["report"] });
  };
  const createExpenseMutation = useMutation({ mutationFn: createExpense, onSuccess: invalidateExpensesAndReports });
  const deleteExpenseMutation = useMutation({ mutationFn: deleteExpense, onSuccess: invalidateExpensesAndReports });
  const createCategoryMutation = useMutation({ mutationFn: createCategory, onSuccess: () => { setNewCategory(""); queryClient.invalidateQueries({ queryKey: ["categories"] }); } });
  const error = useMemo(() => categoryQuery.error || expenseQuery.error || reportQuery.error, [categoryQuery.error, expenseQuery.error, reportQuery.error]);
  return <><AppBar position="static"><Toolbar sx={{ display: "flex", justifyContent: "space-between" }}><Typography variant="h6">Expense Tracker</Typography><Button color="inherit" onClick={() => { logout(); navigate("/auth?mode=login"); }}>Logout</Button></Toolbar></AppBar><Container sx={{ mt: 3, mb: 5 }}>{error && <Alert severity="error">{(error as Error).message}</Alert>}<ExpenseForm categories={categoryQuery.data || []} onCreate={async (payload) => { await createExpenseMutation.mutateAsync(payload); }} /><Box mt={2}><Grid container spacing={2}><Grid size={{ xs: 12, md: 4 }}><TextField label="Start date" type="date" fullWidth value={startDate} onChange={(e) => setStartDate(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} /></Grid><Grid size={{ xs: 12, md: 4 }}><TextField label="End date" type="date" fullWidth value={endDate} onChange={(e) => setEndDate(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} /></Grid><Grid size={{ xs: 12, md: 4 }}><TextField select label="Filter category" fullWidth value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}><MenuItem value="">All</MenuItem>{(categoryQuery.data || []).map((c) => <MenuItem key={c.categoryId} value={c.categoryId}>{c.name}</MenuItem>)}</TextField></Grid></Grid></Box><Box mt={2}><ExpenseList expenses={expenseQuery.data || []} categories={categoryQuery.data || []} onDelete={async (expenseId) => { await deleteExpenseMutation.mutateAsync(expenseId); }} /></Box><Box mt={2}><Grid container spacing={2}><Grid size={{ xs: 12 }}><SpendingTrendsChart /></Grid><Grid size={{ xs: 12, md: 6 }}><ReportPanel report={reportQuery.data} categories={categoryQuery.data || []} /></Grid><Grid size={{ xs: 12, md: 6 }}><Stack spacing={2}><TextField label="Month" type="month" value={month} onChange={(e) => setMonth(e.target.value)} fullWidth slotProps={{ inputLabel: { shrink: true } }} /><Typography variant="h6">Add Category</Typography><Stack direction="row" spacing={1}><TextField fullWidth value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="e.g. Travel" /><Button variant="contained" onClick={async () => { if (!newCategory.trim()) return; await createCategoryMutation.mutateAsync(newCategory.trim()); }}>Add</Button></Stack></Stack></Grid></Grid></Box></Container></>;
}
