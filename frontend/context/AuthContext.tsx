"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";

type AuthContextType = {
  user: { email: string } | null;
  token: string | null;
  name: string | null;
  loading: boolean;
  login: (email: string, token?: string) => void;
  setName: (name: string | null) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const savedToken = localStorage.getItem("token");
    const savedName = localStorage.getItem("name");

    if (savedUser) setUser(JSON.parse(savedUser));
    if (savedToken) setToken(savedToken);
    if (savedName) setName(savedName);

    setLoading(false); // ✅ done loading persisted data
  }, []);

  const login = (email: string, tokenValue?: string) => {
    const fakeUser = { email };
    setUser(fakeUser);
    if (tokenValue) {
      setToken(tokenValue);
      localStorage.setItem("token", tokenValue);
    }
    localStorage.setItem("user", JSON.stringify(fakeUser));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setName(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("name");
  };

  useEffect(() => {
    if (name) localStorage.setItem("name", name);
  }, [name]);

  return (
    <AuthContext.Provider value={{ user, token, name, loading, login, setName, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
