import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, ListOrdered, Plus, Shield, LogOut, PiggyBank, UserRound } from "lucide-react";

export function AppShell({
  children,
  requireAdmin = false,
}: {
  children: ReactNode;
  requireAdmin?: boolean;
}) {
  const { user, loading, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!loading && user && requireAdmin && !isAdmin) navigate({ to: "/dashboard" });
  }, [loading, user, isAdmin, requireAdmin, navigate]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-pulse rounded-full bg-emerald-gradient" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-emerald-gradient shadow-glow" />
            <span className="font-display text-lg font-semibold">Ledgerly</span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            <NavLink to="/dashboard" icon={<LayoutDashboard className="h-4 w-4" />}>Dashboard</NavLink>
            <NavLink to="/transactions" icon={<ListOrdered className="h-4 w-4" />}>Transactions</NavLink>
            <NavLink to="/transactions/new" icon={<Plus className="h-4 w-4" />}>New</NavLink>
            <NavLink to="/budgets" icon={<PiggyBank className="h-4 w-4" />}>Budgets</NavLink>
            {isAdmin && (
              <NavLink to="/admin" icon={<Shield className="h-4 w-4" />}>Admin</NavLink>
            )}
          </nav>
          <div className="flex items-center gap-1">
            <NavLink to="/profile" icon={<UserRound className="h-4 w-4" />}>{user.name}</NavLink>
            <Button variant="ghost" size="sm" onClick={() => signOut()}>
              <LogOut className="mr-2 h-4 w-4" /> Sign out
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-10">{children}</main>
    </div>
  );
}

function NavLink({ to, icon, children }: { to: string; icon: ReactNode; children: ReactNode }) {
  return (
    <Link
      to={to}
      activeProps={{ className: "bg-secondary text-foreground" }}
      className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition hover:bg-secondary/60 hover:text-foreground"
    >
      {icon}
      {children}
    </Link>
  );
}
