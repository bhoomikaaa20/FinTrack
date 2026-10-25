import { fmt } from "@/lib/constants";

export interface Budget {
  id: string;
  category: string;
  limit: number;
  spent: number;
}

export function BudgetBar({ budget }: { budget: Budget }) {
  const pct = budget.limit > 0 ? (budget.spent / budget.limit) * 100 : 0;
  const over = pct > 100;
  const near = pct >= 80 && !over;
  return (
    <div>
      <div className="flex justify-between text-sm">
        <span className="font-medium">{budget.category}</span>
        <span className="text-muted-foreground">
          <span className={over ? "text-destructive" : near ? "text-warning" : "text-foreground"}>{fmt(budget.spent)}</span> / {fmt(budget.limit)}
        </span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
        <div
          className={`h-full rounded-full ${over ? "bg-destructive" : near ? "bg-warning" : "bg-emerald-gradient"}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <div className="mt-1 text-xs text-muted-foreground">
        {over ? `Over by ${fmt(budget.spent - budget.limit)}` : `${fmt(budget.limit - budget.spent)} left · ${Math.round(pct)}% used`}
      </div>
    </div>
  );
}
