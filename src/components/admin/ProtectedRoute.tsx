import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    console.log("LOG (ProtectedRoute): Iniciando verificação de acesso.");
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        console.log("LOG (ProtectedRoute): Usuário não logado. Redirecionando para /login.");
        toast.error("Você precisa estar logado para acessar o admin");
        navigate("/login"); // <-- AJUSTADO
        return;
      }

      console.log(`LOG (ProtectedRoute): Usuário ${user.email} logado. Verificando permissão de 'admin'.`);

      // Verificar se o usuário tem role de admin
      const { data: userRoles, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .single();

      if (error || !userRoles) {
        console.warn("LOG (ProtectedRoute): Acesso negado. Usuário não é 'admin'. Redirecionando.");
        toast.error("Acesso negado. Você não tem permissão de administrador.");
        navigate("/login"); // <-- AJUSTADO
        return;
      }

      console.log("LOG (ProtectedRoute): Acesso de admin concedido.");
      setIsAdmin(true);
    } catch (error) {
      console.error("Erro ao verificar acesso admin:", error);
      toast.error("Erro ao verificar permissões");
      navigate("/login"); // <-- AJUSTADO
    }
  };

  if (isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-lg">Verificando permissões...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return <>{children}</>;
};