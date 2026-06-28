"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  clearToken,
  fetchMe,
  getToken,
  googleSignIn,
  setToken,
  type AuthUser,
} from "@/lib/auth";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type AuthContextValue = {
  user: AuthUser | null;
  status: AuthStatus;
  signIn: (credential: string) => Promise<void>;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  useEffect(() => {
    let active = true;
    (async () => {
      if (!getToken()) {
        if (active) setStatus("unauthenticated");
        return;
      }
      try {
        const me = await fetchMe();
        if (active) {
          setUser(me);
          setStatus("authenticated");
        }
      } catch {
        clearToken();
        if (active) {
          setUser(null);
          setStatus("unauthenticated");
        }
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  async function signIn(credential: string) {
    const { token, user: signedIn } = await googleSignIn(credential);
    setToken(token);
    setUser(signedIn);
    setStatus("authenticated");
  }

  function signOut() {
    clearToken();
    setUser(null);
    setStatus("unauthenticated");
  }

  return (
    <AuthContext.Provider value={{ user, status, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
