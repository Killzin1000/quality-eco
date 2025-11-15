import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const Login = () => {
  const navigate = useNavigate();

  console.log("LOG: Renderizando página de Login.");

  // Escuta mudanças na autenticação
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN") {
        console.log("LOG: Usuário LOGADO, redirecionando para /admin");
        toast.success("Login realizado com sucesso!");
        // Redireciona para o admin após o login
        navigate("/admin");
      }
    });

    // Limpa o listener ao desmontar o componente
    return () => {
      subscription?.unsubscribe();
    };
  }, [navigate]);

  // Verifica se o usuário JÁ está logado ao carregar a página
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        console.log("LOG: Sessão ativa encontrada, redirecionando para /admin");
        navigate("/admin");
      }
    };
    checkSession();
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="container mx-auto px-4 py-12 flex-1 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-2xl">Acesso Restrito</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground mb-6">
              Utilize seu email e senha de administrador para acessar o painel.
            </p>
            <Auth
              supabaseClient={supabase}
              appearance={{ theme: ThemeSupa }}
              providers={[]} // Sem provedores como Google, Facebook, etc.
              onlyThirdPartyProviders={false}
              view="sign_in" // <-- AJUSTADO AQUI
              localization={{
                variables: {
                  sign_in: { // <-- AJUSTADO AQUI
                    email_label: "Email",
                    email_input_placeholder: "seu.email@exemplo.com",
                    password_label: "Senha",
                    password_input_placeholder: "Sua senha",
                    button_label: "Entrar",
                    loading_button_label: "Entrando...",
                    social_provider_text: "Entrar com {{provider}}",
                    link_text: "Não tem conta? Cadastre-se", // Embora não vamos usar, é bom ter
                    forgotten_password_link_text: "Esqueceu sua senha?",
                  },
                  // Também ajustei o de senha esquecida
                  forgotten_password: {
                    email_label: "Email",
                    email_input_placeholder: "seu.email@exemplo.com",
                    button_label: "Enviar instruções",
                    loading_button_label: "Enviando...",
                    link_text: "Lembrou da senha? Voltar para o login",
                    confirmation_text: "Verifique seu email pelo link de redefinição!"
                  }
                },
              }}
              theme="dark" // Pode ajustar para "light" ou "dark"
            />
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default Login;