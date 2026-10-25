import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { CATEGORIES } from "@/lib/constants";

export interface TransactionFormValues {
  amount: string;
  type: "income" | "expense";
  category: string;
  date: string;
  description: string;
  file_url?: string | null;
}

// Shared by "New transaction" and "Edit transaction"; builds the multipart payload the API expects
export function TransactionForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial: TransactionFormValues;
  submitLabel: string;
  onSubmit: (formData: FormData, amount: number) => Promise<void>;
  onCancel: () => void;
}) {
  const [amount, setAmount] = useState(initial.amount);
  const [type, setType] = useState<"income" | "expense">(initial.type);
  const [category, setCategory] = useState(initial.category);
  const [date, setDate] = useState(initial.date);
  const [description, setDescription] = useState(initial.description);
  const [file, setFile] = useState<File | null>(null);
  const [removeFile, setRemoveFile] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();

    const amt = parseFloat(amount);
    if (isNaN(amt) || amt < 0) return toast.error("Enter a valid amount");

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("amount", String(amt));
      formData.append("type", type);
      formData.append("category", category);
      formData.append("date", date);
      formData.append("description", description);

      if (file) {
        formData.append("file", file);
      } else if (removeFile) {
        formData.append("remove_file", "true");
      }

      await onSubmit(formData, amt);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5 rounded-2xl border border-border/60 bg-card p-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label>Amount</Label>
          <Input type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        </div>
        <div>
          <Label>Type</Label>
          <Select value={type} onValueChange={(v) => setType(v as "income" | "expense")}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="income">Income</SelectItem>
              <SelectItem value="expense">Expense</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {/* Keep a legacy category selectable when editing older records */}
              {(CATEGORIES.includes(category) ? CATEGORIES : [...CATEGORIES, category]).map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Date</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>
      </div>
      <div>
        <Label>Description</Label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} maxLength={500} />
      </div>
      <div>
        <Label>{initial.file_url ? "Replace receipt (optional)" : "Receipt (optional)"}</Label>
        <Input type="file" accept="image/*,application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        {initial.file_url && !file && (
          <div className="mt-2 flex items-center gap-4 text-sm">
            <a href={initial.file_url} target="_blank" rel="noreferrer" className="text-primary hover:underline">View current receipt</a>
            <label className="flex items-center gap-2 text-muted-foreground">
              <Checkbox checked={removeFile} onCheckedChange={(v) => setRemoveFile(v === true)} />
              Remove receipt
            </label>
          </div>
        )}
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={loading} className="bg-emerald-gradient text-primary-foreground hover:opacity-90">
          {loading ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
