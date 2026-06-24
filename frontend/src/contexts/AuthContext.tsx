import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { apiFetch } from "@/lib/api";

export type UserRole = "admin" | "professor" | "aluno";

interface UserData {
  name: string;
  profilePicture?: string;
  email: string;
  role: UserRole;
  initials: string;
  course?: string;
  sub?: string;
  id?: string;
  username?: string;
}

interface AuthContextType {
  user: UserData | null;
  role: UserRole | null;
  login: (userData: UserData) => void;
  logout: () => void;
  isLoggedIn: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  login: () => {},
  logout: () => {},
  isLoggedIn: false,
  loading: true,
});

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const getCourseFromEmail = (email: string): string | undefined => {
  if (email.includes('@aluno.uespi.br')) {
    return "Ciência da Computação";
  }
  return undefined;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        console.log("🔍 Verificando sessão...");
        
        const response = await apiFetch("/me", {
          method: "GET",
        });
        
        if (response.ok) {
          const sessionUser = await response.json();
          console.log("✅ Sessão ativa encontrada:", sessionUser);
          
          const storedUser = localStorage.getItem("user");
          
          if (storedUser) {
            const userData = JSON.parse(storedUser);
            setUser(userData);
          } else {
            // Criar UserData com os dados da sessão
            const userData: UserData = {
              name: sessionUser.name || sessionUser.username.split('@')[0],
              email: sessionUser.username,
              role: sessionUser.role as UserRole,
              initials: getInitials(sessionUser.name || sessionUser.username),
              profilePicture: sessionUser.profile_picture || undefined,
              course: getCourseFromEmail(sessionUser.username),
              id: sessionUser.id,
              username: sessionUser.username,
            };
            setUser(userData);
            localStorage.setItem("user", JSON.stringify(userData));
          }
        } else {
          console.log("❌ Nenhuma sessão ativa");
          setUser(null);
          localStorage.removeItem("user");
        }
      } catch (error) {
        console.error("Erro ao verificar sessão:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  const login = (userData: UserData) => {
    console.log("📸 Login com dados:", userData);
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const logout = async () => {
    try {
      await apiFetch("/logout", { method: "POST" });
    } catch (error) {
      console.error("Erro no logout:", error);
    }
    
    setUser(null);
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      role: user?.role ?? null, 
      login, 
      logout, 
      isLoggedIn: !!user,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);