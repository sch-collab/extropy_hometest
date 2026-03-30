import { Box, CircularProgress, Paper, Typography } from "@mui/material";
import { useQueries } from "@tanstack/react-query";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getReportSummary } from "../api/reports";
import { formatMonthShort, lastNMonthKeys } from "../utils/monthKeys";

const TREND_MONTHS = 6;

export default function SpendingTrendsChart() {
  const monthKeys = lastNMonthKeys(TREND_MONTHS);
  const results = useQueries({
    queries: monthKeys.map((month) => ({
      queryKey: ["report", month] as const,
      queryFn: () => getReportSummary(month),
    })),
  });

  const loading = results.some((r) => r.isPending);
  const err = results.find((r) => r.error)?.error;

  const data = monthKeys.map((month, i) => ({
    month,
    label: formatMonthShort(month),
    total: results[i].data?.total ?? 0,
  }));

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" mb={2}>
        Spending trends
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Total spending per month (last {TREND_MONTHS} months)
      </Typography>
      {err && (
        <Typography color="error">{(err as Error).message}</Typography>
      )}
      {!err && loading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress size={32} />
        </Box>
      )}
      {!err && !loading && (
        <Box sx={{ width: "100%", height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} interval={0} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v}`} width={56} />
              <Tooltip formatter={(value) => [`$${Number(value ?? 0).toFixed(2)}`, "Total"]} />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#0066cc"
                strokeWidth={2}
                dot={{ r: 4, fill: "#0066cc" }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      )}
    </Paper>
  );
}
