import { toast } from "sonner";
import { HIGH_VALUE_THRESHOLD, fmt, type BudgetAlert } from "@/lib/constants";

// Shows the success toast plus a budget warning when the API reports one
export function notifySaved(amount: number, budgetAlert: BudgetAlert | null | undefined, verb: "Saved" | "Updated" = "Saved") {
  toast.success(amount > HIGH_VALUE_THRESHOLD ? `${verb} — flagged as HIGH value` : `Transaction ${verb.toLowerCase()}`);
  if (budgetAlert) {
    toast.warning(`Over budget: ${budgetAlert.category} — ${fmt(budgetAlert.spent)} of ${fmt(budgetAlert.limit)} this month`);
  }
}
