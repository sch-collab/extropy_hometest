import { Paper, Stack, Typography } from "@mui/material";
import { Category, ReportSummary } from "../types";
interface Props { report?: ReportSummary; categories: Category[]; }
export default function ReportPanel({ report, categories }: Props) {
  const categoryName = (id: string) => categories.find((c) => c.categoryId === id)?.name || id;
  return <Paper sx={{ p: 2 }}><Typography variant="h6" mb={2}>Monthly Summary</Typography>{!report && <Typography color="text.secondary">Pick a month to see totals.</Typography>}{report && <Stack spacing={1}><Typography><strong>Month:</strong> {report.month}</Typography><Typography><strong>Total:</strong> ${report.total.toFixed(2)}</Typography><Typography><strong>By category:</strong></Typography>{report.byCategory.map((row) => <Typography key={row.categoryId}>- {categoryName(row.categoryId)}: ${row.total.toFixed(2)}</Typography>)}</Stack>}</Paper>;
}
