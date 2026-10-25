import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { API_URL } from "@/lib/api";

export const Route = createFileRoute("/profile")({
  component: () => (
    <AppShell>
      <Profile />
    </AppShell>
  ),
});

async function send(path: string, body: unknown) {
  const res = await fetch(`${API_URL}${path}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Something went wrong");
  return data;
}

function Profile() {
  const { user, roles, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [savingName, setSavingName] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPw, setSavingPw] = useState(false);

  async function saveName(e: FormEvent) {
    e.preventDefault();
    setSavingName(true);
    try {
      await send("/api/auth/profile", { name });
      await refreshUser();
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSavingName(false);
    }
  }

  async function savePassword(e: FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) return toast.error("New passwords don't match");
    setSavingPw(true);
    try {
      await send("/api/auth/password", { currentPassword, newPassword });
      toast.success("Password changed");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSavingPw(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-muted-foreground">Manage your account details and password.</p>
      </div>

      <form onSubmit={saveName} className="space-y-5 rounded-2xl border border-border/60 bg-card p-6">
        <h2 className="text-lg font-semibold">Account</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={user?.email ?? ""} disabled />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Role: <span className="capitalize text-foreground">{roles[0] ?? "user"}</span>
          </span>
          <Button type="submit" disabled={savingName} className="bg-emerald-gradient text-primary-foreground hover:opacity-90">
            {savingName ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </form>

      <form onSubmit={savePassword} className="space-y-5 rounded-2xl border border-border/60 bg-card p-6">
        <h2 className="text-lg font-semibold">Change password</h2>
        <div>
          <Label htmlFor="current">Current password</Label>
          <Input id="current" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="new">New password</Label>
            <Input id="new" type="password" minLength={6} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="confirm">Confirm new password</Label>
            <Input id="confirm" type="password" minLength={6} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
          </div>
        </div>
        <div className="flex justify-end">
          <Button type="submit" disabled={savingPw} variant="outline">
            {savingPw ? "Updating…" : "Update password"}
          </Button>
        </div>
      </form>
    </div>
  );
}
