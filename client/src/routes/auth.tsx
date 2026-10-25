import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { API_URL } from "@/lib/api";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { mode?: "signup" | "login" } => ({
    mode: s.mode === "signup" ? "signup" : "login",
  }),
  component: AuthPage,
});

function AuthPage() {
  const { mode } = Route.useSearch();
  const navigate = useNavigate();
  const { refreshUser } = useAuth(); // ✅ FIX

  const [isSignup, setIsSignup] = useState(mode === "signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const url = isSignup
        ? `${API_URL}/api/auth/signup`
        : `${API_URL}/api/auth/login`;

      const body = isSignup
        ? { name, email, password }
        : { email, password };

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Something went wrong");
      }

      if (isSignup) {
        toast.success("Account created! Please sign in.");

        // 🔥 switch to login mode
        setIsSignup(false);

        // optional: clear fields
        setName("");
        setEmail("");
        setPassword("");

      } else {
        toast.success("Welcome back!");

        await refreshUser();
        navigate({ to: "/dashboard" });
      }

    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-hero flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-emerald-gradient shadow-glow" />
          <span className="font-display text-lg font-semibold">Ledgerly</span>
        </Link>

        <div className="shadow-card-elevated rounded-2xl border border-border/60 bg-card/80 p-8 backdrop-blur">
          <h1 className="text-2xl font-bold">
            {isSignup ? "Create your account" : "Welcome back"}
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            {isSignup
              ? "Start tracking in under a minute."
              : "Sign in to your dashboard."}
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {isSignup && (
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-gradient text-primary-foreground hover:opacity-90"
            >
              {loading
                ? "Please wait…"
                : isSignup
                  ? "Create account"
                  : "Sign in"}
            </Button>
          </form>

          <button
            type="button"
            onClick={() => setIsSignup((v) => !v)}
            className="mt-6 w-full text-center text-sm text-muted-foreground hover:text-foreground"
          >
            {isSignup
              ? "Already have an account? Sign in"
              : "Don't have an account? Sign up"}
          </button>
        </div>
      </div>
    </div>
  );
}
