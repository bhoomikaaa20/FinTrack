import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { TransactionForm, type TransactionFormValues } from "@/components/TransactionForm";
import { notifySaved } from "@/lib/notify";
import { Button } from "@/components/ui/button";
import { API_URL } from "@/lib/api";

export const Route = createFileRoute("/transactions/$id/edit")({
  component: () => (
    <AppShell>
      <EditTxn />
    </AppShell>
  ),
});

function EditTxn() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [initial, setInitial] = useState<TransactionFormValues | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API_URL}/api/transactions/${id}`, { credentials: "include" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);

        const t = data.transaction;
        setInitial({
          amount: String(t.amount),
          type: t.type,
          category: t.category,
          date: String(t.date).slice(0, 10),
          description: t.description ?? "",
          file_url: t.file_url,
        });
      } catch {
        setNotFound(true);
      }
    }
    load();
  }, [id]);

  async function save(formData: FormData, amt: number) {
    const res = await fetch(`${API_URL}/api/transactions/${id}`, {
      method: "PUT",
      credentials: "include",
      body: formData,
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.message);

    notifySaved(amt, data.budget_alert, "Updated");

    navigate({ to: "/transactions" });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Edit transaction</h1>
        <p className="text-muted-foreground">Amounts over $50,000 are auto-flagged as high value.</p>
      </div>
      {notFound ? (
        <div className="rounded-2xl border border-border/60 bg-card p-8 text-center">
          <p className="text-muted-foreground">This transaction doesn't exist or you don't have access to it.</p>
          <Link to="/transactions"><Button variant="outline" className="mt-4">Back to transactions</Button></Link>
        </div>
      ) : !initial ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <TransactionForm
          initial={initial}
          submitLabel="Save changes"
          onSubmit={save}
          onCancel={() => navigate({ to: "/transactions" })}
        />
      )}
    </div>
  );
}
