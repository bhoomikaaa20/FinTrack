import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Download, Trash2, Search, Pencil } from "lucide-react";
import { toast } from "sonner";
import { API_URL } from "@/lib/api";

export const Route = createFileRoute("/transactions/")({
  component: () => (
    <AppShell>
      <List />
    </AppShell>
  ),
});

interface Txn {
  id: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  date: string;
  description: string | null;
  status: "normal" | "high";
  file_url: string | null;
}

function List() {
  const { user } = useAuth();
  const [txns, setTxns] = useState<Txn[]>([]);
  const [q, setQ] = useState("");
  const [type, setType] = useState<"all" | "income" | "expense">("all");
  const [status, setStatus] = useState<"all" | "normal" | "high">("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sort, setSort] = useState<"date_desc" | "date_asc" | "amount_desc" | "amount_asc">("date_desc");

  const load = async () => {
    try {
      const res = await fetch(`${API_URL}/api/transactions`, {
        credentials: "include",
      });

      const data = await res.json();
      setTxns(data.transactions || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (user) load();
  }, [user]);

  const filtered = useMemo(() => {
    return txns.filter((t) => {
      if (type !== "all" && t.type !== type) return false;
      if (status !== "all" && t.status !== status) return false;
      // t.date is a full ISO timestamp; compare only the YYYY-MM-DD part so the "to" day is inclusive
      const day = t.date.slice(0, 10);
      if (from && day < from) return false;
      if (to && day > to) return false;
      if (q) {
        const needle = q.toLowerCase();
        const hay = `${t.category} ${t.description ?? ""}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    }).sort((a, b) => {
      if (sort === "amount_desc") return b.amount - a.amount;
      if (sort === "amount_asc") return a.amount - b.amount;
      const diff = new Date(a.date).getTime() - new Date(b.date).getTime();
      return sort === "date_asc" ? diff : -diff;
    });
  }, [txns, q, type, status, from, to, sort]);

  async function remove(id: string) {
    if (!window.confirm("Delete this transaction? This cannot be undone.")) return;

    try {
      const res = await fetch(`${API_URL}/api/transactions/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message);

      toast.success("Deleted");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  }

  function exportCsv() {
    const headers = ["date", "type", "category", "amount", "status", "description"];
    const rows = filtered.map((t) =>
      [t.date, t.type, t.category, t.amount, t.status, (t.description ?? "").replace(/"/g, '""')]
        .map((v) => `"${v}"`)
        .join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Transactions</h1>
          <p className="text-muted-foreground">{filtered.length} of {txns.length}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCsv} disabled={filtered.length === 0}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
          <Link to="/transactions/new">
            <Button className="bg-emerald-gradient text-primary-foreground hover:opacity-90">
              <Plus className="mr-2 h-4 w-4" /> Add
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-3 rounded-2xl border border-border/60 bg-card p-4 md:grid-cols-6">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search category or note…" className="pl-8" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Select value={type} onValueChange={(v) => setType(v as "all" | "income" | "expense")}>
          <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="income">Income</SelectItem>
            <SelectItem value="expense">Expense</SelectItem>
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(v) => setStatus(v as "all" | "normal" | "high")}>
          <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="high">High value</SelectItem>
          </SelectContent>
        </Select>
        <Input type="date" aria-label="From date" value={from} onChange={(e) => setFrom(e.target.value)} />
        <Input type="date" aria-label="To date" value={to} onChange={(e) => setTo(e.target.value)} />
        <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
          <SelectTrigger><SelectValue placeholder="Sort" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="date_desc">Newest first</SelectItem>
            <SelectItem value="date_asc">Oldest first</SelectItem>
            <SelectItem value="amount_desc">Amount: high to low</SelectItem>
            <SelectItem value="amount_asc">Amount: low to high</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border/60 bg-secondary/40 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-3">Date</th>
              <th className="p-3">Category</th>
              <th className="p-3">Type</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Amount</th>
              <th className="p-3">Receipt</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No transactions.</td></tr>
            )}
            {filtered.map((t) => (
              <tr key={t.id} className="border-b border-border/40 last:border-none">
                <td className="p-3">{new Date(t.date).toLocaleDateString("en-GB")}</td>
                <td className="p-3 font-medium">
                  {t.category}
                  {t.description && <div className="text-xs text-muted-foreground">{t.description}</div>}
                </td>
                <td className="p-3 capitalize">{t.type}</td>
                <td className="p-3">
                  {t.status === "high" ? (
                    <span className="rounded-full bg-destructive/20 px-2 py-0.5 text-xs text-destructive">HIGH</span>
                  ) : (
                    <span className="text-xs text-muted-foreground">normal</span>
                  )}
                </td>
                <td className={`p-3 text-right font-semibold ${t.type === "income" ? "text-primary" : "text-warning"}`}>
                  {t.type === "income" ? "+" : "-"}
                  {Number(t.amount).toLocaleString("en-US", { style: "currency", currency: "USD" })}
                </td>
                <td className="p-3">
                  {t.file_url ? (
                    <a href={t.file_url} target="_blank" rel="noreferrer" className="text-primary hover:underline">View</a>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
                <td className="whitespace-nowrap p-3 text-right">
                  <Link to="/transactions/$id/edit" params={{ id: t.id }}>
                    <Button size="sm" variant="ghost" aria-label="Edit transaction">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button size="sm" variant="ghost" aria-label="Delete transaction" onClick={() => remove(t.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
