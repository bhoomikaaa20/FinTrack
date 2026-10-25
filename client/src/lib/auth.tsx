import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { API_URL } from "@/lib/api";

type Role = "admin" | "user";

interface User {
  _id: string;
  name: string;
  email: string;
}

interface AuthCtx {
  user: User | null;
  loading: boolean;
  roles: Role[];
  isAdmin: boolean;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ FIX: reusable function
  async function refreshUser() {
    try {
      const res = await fetch(`${API_URL}/api/auth/me`, {
        credentials: "include",
      });

      const data = await res.json();

      if (data.user) {
        setUser(data.user);
        setRoles(data.roles || []);
      } else {
        setUser(null);
        setRoles([]);
      }
    } catch {
      setUser(null);
      setRoles([]);
    } finally {
      setLoading(false);
    }
  }

  // ✅ FIX: use refreshUser here
  useEffect(() => {
    refreshUser();
  }, []);

  const signOut = async () => {
    await fetch(`${API_URL}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
    });

    setUser(null);
    setRoles([]);
  };

  return (
    <Ctx.Provider
      value={{
        user,
        loading,
        roles,
        isAdmin: roles.includes("admin"),
        signOut,
        refreshUser, // 🔥 IMPORTANT
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth outside provider");
  return c;
}
