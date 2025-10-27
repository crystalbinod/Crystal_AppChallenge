import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { auth } from "../lib/firebase";

type AuthCtx = {
  user: User | null;
  loading: boolean;
  signOutAsync: () => Promise<void>;
};

const Ctx = createContext<AuthCtx>({ user: null, loading: true, signOutAsync: async () => {} });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sub = onAuthStateChanged(auth, (u) => {
      setUser(u ?? null);
      setLoading(false);
    });
    return sub; // unsubscribe on unmount
  }, []);

  const signOutAsync = async () => { await signOut(auth); };

  return <Ctx.Provider value={{ user, loading, signOutAsync }}>{children}</Ctx.Provider>;
}
//function that cna be used in other file to check login
export const useAuth = () => useContext(Ctx);
{/*check auth state anywhere*/}
{/**/}