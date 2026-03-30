import type { Category, Expense } from "../types";

function escapeCsvField(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function categoryName(categories: Category[], id: string): string {
  return categories.find((c) => c.categoryId === id)?.name ?? "Unknown";
}

export function buildExpensesCsv(expenses: Expense[], categories: Category[]): string {
  const header = ["Date", "Category", "Amount", "Description"].map(escapeCsvField).join(",");
  const rows = expenses.map((e) =>
    [
      escapeCsvField(e.date),
      escapeCsvField(categoryName(categories, e.categoryId)),
      escapeCsvField(e.amount.toFixed(2)),
      escapeCsvField(e.description ?? ""),
    ].join(",")
  );
  return `\uFEFF${[header, ...rows].join("\r\n")}`;
}

export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
