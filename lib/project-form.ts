export function parseAmountInput(value: string | number | null | undefined) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : NaN;
  }

  const rawValue = String(value ?? "").trim();
  if (!rawValue) {
    return 0;
  }

  const normalized = rawValue
    .replace(/[^0-9.-]/g, "")
    .trim();

  if (!normalized) {
    return NaN;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : NaN;
}

export function calculateProjectBudget(
  phases: Array<{ amount: string | number | null | undefined }>,
) {
  return phases.reduce((sum, phase) => {
    const amount = parseAmountInput(phase.amount);
    return Number.isNaN(amount) ? sum : sum + amount;
  }, 0);
}

export function toDateInputValue(value: string | Date | null | undefined) {
  if (!value) {
    return "";
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}
