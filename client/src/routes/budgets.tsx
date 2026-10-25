import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { API_URL } from "@/lib/api";
import { EXPENSE_CATEGORIES, fmt } from "@/lib/constants";
import { BudgetBar, type Budget } from "@/components/BudgetBar";

export const Route = createFileRoute("/budgets")({
  component: () => (
    <AppShell>
      <Budgets />
    </AppShell>
  ),
});

function Budgets() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [limit, setLimit] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const res = await fetch(`${API_URL}/api/budgets`, { credentials: "include" });
      const data = await res.json();
      setBudgets(data.budgets || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  async function save(e: FormEvent) {
    e.preventDefault();
    const amt = parseFloat(limit);
    if (isNaN(amt) || amt <= 0) return toast.error("Enter a valid monthly limit");

    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/budgets`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ category, limit: amt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      toast.success(`Budget set for ${category}`);
      setLimit("");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save budget");
    } finally {
      setSaving(false);
    }
  }

  async function remove(b: Budget) {
    if (!window.confirm(`Remove the ${b.category} budget?`)) return;
    try {
      const res = await fetch(`${API_URL}/api/budgets/${b.id}`, { method: "DELETE", credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success("Budget removed");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  }

  const totalLimit = budgets.reduce((s, b) => s + b.limit, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);
  const month = new Date().toLocaleString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Budgets</h1>
        <p className="text-muted-foreground">Monthly spending limits per category · {month}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Stat label="Budgeted this month" value={fmt(totalLimit)} />
        <Stat label="Spent in budgeted categories" value={fmt(totalSpent)} tone="text-warning" />
        <Stat
          label="Remaining"
          value={fmt(totalLimit - totalSpent)}
          tone={totalLimit - totalSpent < 0 ? "text-destructive" : "text-primary"}
        />
      </div>

      <form onSubmit={save} className="grid items-end gap-4 rounded-2xl border border-border/60 bg-card p-6 md:grid-cols-[1fr_1fr_auto]">
        <div>
          <Label>Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {EXPENSE_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Monthly limit</Label>
          <Input type="number" step="0.01" min="0" placeholder="e.g. 500" value={limit} onChange={(e) => setLimit(e.target.value)} required />
        </div>
        <Button type="submit" disabled={saving} className="bg-emerald-gradient text-primary-foreground hover:opacity-90">
          {saving ? "Saving…" : "Set budget"}
        </Button>
      </form>

      <div className="rounded-2xl border border-border/60 bg-card p-6">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : budgets.length === 0 ? (
          <p className="text-sm text-muted-foreground">No budgets yet — set a monthly limit above to start tracking.</p>
        ) : (
          <ul className="space-y-5">
            {budgets.map((b) => (
              <li key={b.id} className="flex items-center gap-4">
                <div className="flex-1">
                  <BudgetBar budget={b} />
                </div>
                <Button size="sm" variant="ghost" aria-label={`Remove ${b.category} budget`} onClick={() => remove(b)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`mt-2 text-2xl font-bold ${tone ?? ""}`}>{value}</div>
    </div>
  );
}
