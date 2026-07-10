import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { signIn, signUp, user } = useAuth();

  const [isRegister, setIsRegister] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Se o usuário já tiver sessão ativa (ex: acessou /login por engano),
  // manda direto pro dashboard.
  useEffect(() => {
    if (user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();

    setLoading(true);
    setMessage("");

    const error = isRegister
      ? await signUp(email, password)
      : await signIn(email, password);

    if (error) {
      setMessage(error.message);
    } else if (isRegister) {
      setMessage(
        "Conta criada com sucesso! Verifique seu e-mail caso a confirmação esteja ativada."
      );
    } else {
      navigate("/dashboard", { replace: true });
    }

    setLoading(false);
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#f5f5f5",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: 400,
          background: "#fff",
          padding: 30,
          borderRadius: 10,
          boxShadow: "0 10px 30px rgba(0,0,0,.1)",
        }}
      >
        <h2 style={{ textAlign: "center", marginBottom: 25 }}>
          {isRegister ? "Criar Conta" : "Entrar"}
        </h2>

        <input
          type="email"
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{
            width: "100%",
            padding: 12,
            marginBottom: 15,
            borderRadius: 6,
            border: "1px solid #ccc",
          }}
        />

        <input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{
            width: "100%",
            padding: 12,
            marginBottom: 15,
            borderRadius: 6,
            border: "1px solid #ccc",
          }}
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: 12,
            border: 0,
            borderRadius: 6,
            cursor: "pointer",
            background: "#2563eb",
            color: "#fff",
            fontWeight: "bold",
          }}
        >
          {loading
            ? "Carregando..."
            : isRegister
            ? "Criar Conta"
            : "Entrar"}
        </button>

        {message && (
          <p
            style={{
              marginTop: 15,
              textAlign: "center",
            }}
          >
            {message}
          </p>
        )}

        <p
          style={{
            marginTop: 20,
            textAlign: "center",
          }}
        >
          {isRegister ? "Já possui conta?" : "Ainda não possui conta?"}
        </p>

        <button
          type="button"
          onClick={() => setIsRegister(!isRegister)}
          style={{
            width: "100%",
            padding: 10,
            marginTop: 10,
            borderRadius: 6,
            border: "1px solid #2563eb",
            background: "transparent",
            color: "#2563eb",
            cursor: "pointer",
          }}
        >
          {isRegister ? "Entrar" : "Criar Conta"}
        </button>
      </form>
    </div>
  );
}