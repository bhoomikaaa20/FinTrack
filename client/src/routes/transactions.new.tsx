import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { TransactionForm } from "@/components/TransactionForm";
import { notifySaved } from "@/lib/notify";
import { API_URL } from "@/lib/api";

export const Route = createFileRoute("/transactions/new")({
  component: () => (
    <AppShell>
      <NewTxn />
    </AppShell>
  ),
});

function NewTxn() {
  const navigate = useNavigate();

  async function save(formData: FormData, amt: number) {
    const res = await fetch(`${API_URL}/api/transactions`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.message);

    notifySaved(amt, data.budget_alert);

    navigate({ to: "/transactions" });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">New transaction</h1>
        <p className="text-muted-foreground">Amounts over $50,000 are auto-flagged as high value.</p>
      </div>
      <TransactionForm
        initial={{ amount: "", type: "expense", category: "Other", date: new Date().toISOString().slice(0, 10), description: "" }}
        submitLabel="Save transaction"
        onSubmit={save}
        onCancel={() => navigate({ to: "/transactions" })}
      />
    </div>
  );
}
