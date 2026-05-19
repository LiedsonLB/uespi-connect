import GoogleLoginButton from "@/components/ui/GoogleLoginButton";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";

interface GoogleUser {
  email: string;
  name: string;
  picture: string;
  sub: string;
  given_name?: string;
  family_name?: string;
}

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (googleUser: GoogleUser) => {
    setLoading(true);
    setError(null);

    const { email, name, picture, sub } = googleUser;

    // =========================
    // ROLE BASEADO NO EMAIL
    // =========================
    let role: UserRole = "aluno";

    if (email.endsWith("@aluno.uespi.br")) role = "aluno";
    if (email.endsWith("@uespi.br")) role = "professor";
    if (email.endsWith("@prp.uespi.br")) role = "professor";
    if (email === "liedson.b9@gmail.com") role = "admin";

    const initials = name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    const getCourseFromEmail = (email: string): string | undefined => {
      if (email.includes("@aluno.uespi.br"))
        return "Ciência da Computação — 8º Período";

      if (email.includes("@prp.uespi.br"))
        return "Professor(a) de Ciência da Computação";

      return undefined;
    };

    const userData = {
      name,
      email,
      role,
      initials,
      profilePicture: picture,
      sub,
      course: getCourseFromEmail(email),
    };

    console.log("📸 User data com foto:", userData);

    try {
      // senha determinística baseada no Google ID
      const password = `google_${sub.substring(0, 10)}`;

      // Enviar nome e foto no login também
      let response = await apiFetch("/login", {
        method: "POST",
        body: JSON.stringify({
          username: email,
          password,
          name: name,
          profile_picture: picture,
        }),
      });

      let data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem("user", JSON.stringify(userData));
        localStorage.setItem("sessionId", data.user.id);

        login(userData);
        navigate("/");
        return;
      }

      // =========================
      // 2️⃣ USUÁRIO NÃO EXISTE → CRIAR
      // =========================
      console.log("User not found, creating account...");

      const createResponse = await apiFetch("/admin/users", {
        method: "POST",
        body: JSON.stringify({
          username: email,
          name: name,
          profile_picture: picture,
          password,
          role: role === "admin" ? "admin" : "user",
          channel: null,
        }),
      });

      const createData = await createResponse.json();

      if (!createResponse.ok) {
        setError(createData.error || "Erro ao criar usuário");
        return;
      }

      // =========================
      // 3️⃣ LOGIN NOVAMENTE
      // =========================
      response = await apiFetch("/login", {
        method: "POST",
        body: JSON.stringify({
          username: email,
          password,
          name: name,
          profile_picture: picture,
        }),
      });

      data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem("user", JSON.stringify(userData));
        localStorage.setItem("sessionId", data.user.id);

        login(userData);
        navigate("/");
      } else {
        setError("Erro ao fazer login após criar conta");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Erro de conexão com o servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="text-center mb-10 animate-fade-in">
        <div className="w-24 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <img src="/neomeet_icon_cut.png" alt="UESPI Hub Logo" />
        </div>

        <h1 className="text-3xl font-bold text-foreground">
          NeoMeet
        </h1>

        <p className="text-muted-foreground mt-2">
          Plataforma de reuniões e colaboração acadêmica
        </p>
      </div>

      <div className="w-full max-w-3xl">
        <h2 className="text-lg font-semibold text-foreground text-center mb-6">
          Faça login com seu email institucional para acessar o NeoMeet
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-center">
            {error}
          </div>
        )}

        {loading && (
          <div className="mb-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded-lg text-center">
            Processando login...
          </div>
        )}

        <div className="flex justify-center gap-5">
          <GoogleLoginButton onLogin={handleLogin} disabled={loading} />
        </div>

        <p className="text-xs text-muted-foreground text-center mt-8">
          Plataforma de reuniões e colaboração NeoMeet · Versão 1.0.0
          <br />
          <br />
          <span className="opacity-75" style={{ lineHeight: 2 }}>
            Todos os direitos reservados © 2026
            <br />
            Desenvolvido por <a href="https://github.com/liedsonlb" style={{ color: 'inherit', textDecoration: 'underline' }} target="_blank" rel="noopener noreferrer">
              Liedson Barros
            </a>
          </span>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;