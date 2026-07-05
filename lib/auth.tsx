"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";

export type UserRole = "msme" | "bank_officer" | "admin";

interface User {
  email: string;
  role: UserRole;
  name: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, role: UserRole) => void;
  logout: () => void;
  updateUserName: (name: string) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: () => {},
  logout: () => {},
  updateUserName: () => {},
});

const STORAGE_KEY = "msme_fhc_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Restore session from localStorage on mount
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch {
      // Ignore parse errors
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (user?.role === "msme") {
      // 1. Read from localStorage before making API call
      const storedName = localStorage.getItem("msme_business_name");
      if (storedName && user.name !== storedName) {
        setUser(prev => {
          if (!prev) return null;
          const updated = { ...prev, name: storedName };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
          return updated;
        });
      }

      // 2. Fetch the profile details to keep it updated
      const token = localStorage.getItem("saksham_jwt");
      if (token) {
        fetch("http://localhost:4000/api/v1/msme/me/dashboard", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        })
        .then(res => {
          if (res.ok) return res.json();
          throw new Error();
        })
        .then(data => {
          if (data && data.businessName) {
            localStorage.setItem("msme_business_name", data.businessName);
            setUser(prev => {
              if (!prev) return null;
              const updated = { ...prev, name: data.businessName };
              localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
              return updated;
            });
          }
        })
        .catch(() => {});
      }
    }
  }, [user?.role]);

  const login = (email: string, role: UserRole) => {
    const nameMap: Record<UserRole, string> = {
      msme: "Arjuna Textile Mills",
      bank_officer: "Priya Venkataraman",
      admin: "System Admin",
    };
    const newUser: User = { email, role, name: nameMap[role] };
    setUser(newUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));

    if (role === "msme") {
      const token = localStorage.getItem("saksham_jwt");
      if (token) {
        fetch("http://localhost:4000/api/v1/msme/me/dashboard", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        })
        .then(res => {
          if (res.ok) return res.json();
          throw new Error();
        })
        .then(data => {
          if (data && data.businessName) {
            localStorage.setItem("msme_business_name", data.businessName);
            setUser(prev => {
              if (!prev) return null;
              const updated = { ...prev, name: data.businessName };
              localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
              return updated;
            });
          }
        })
        .catch(() => {});
      }
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem("msme_business_name");
  };

  const updateUserName = (name: string) => {
    localStorage.setItem("msme_business_name", name);
    setUser(prev => {
      if (!prev) return null;
      const updated = { ...prev, name };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, updateUserName }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
