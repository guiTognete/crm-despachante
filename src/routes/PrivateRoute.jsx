import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  // Enquanto verifica a sessão
  if (loading) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontSize: "20px",
          fontWeight: "bold",
        }}
      >
        Carregando...
      </div>
    );
  }

  // Se não estiver logado, volta para o login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Se estiver logado, libera acesso
  return children;
}
