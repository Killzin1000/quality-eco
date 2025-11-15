import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Gift, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

const exitIntentSchema = z.object({
  nome: z.string().trim().min(3, "Nome deve ter pelo menos 3 caracteres").max(100),
  telefone: z.string().trim().min(10, "Telefone inválido").max(20),
});

// 1. Adicionamos a prop 'courseName'
interface ExitIntentModalProps {
  courseName?: string;
}

export const ExitIntentModal = ({ courseName }: ExitIntentModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasShown, setHasShown] = useState(false);
  const [cupomCode, setCupomCode] = useState("");
  const [showCupom, setShowCupom] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    nome: "",
    telefone: "",
  });

  useEffect(() => {
    // 2. Se não recebemos um nome de curso, o modal não faz nada.
    if (!courseName) {
      console.log("LOG (ExitIntent): Sem nome de curso, modal desativado.");
      return;
    }

    const shown = sessionStorage.getItem("exitIntentShown");
    if (shown) {
      console.log("LOG (ExitIntent): Modal já foi exibido nesta sessão.");
      setHasShown(true);
      return;
    }

    const handleMouseLeave = (e: MouseEvent) => {
      // 3. A lógica agora verifica se 'courseName' existe E se o modal já não foi mostrado
      if (e.clientY <= 0 && !hasShown && !isOpen && courseName) {
        console.log(`LOG (ExitIntent): Intenção de saída detectada para o curso: ${courseName}`);
        setIsOpen(true);
        setHasShown(true);
        sessionStorage.setItem("exitIntentShown", "true");
      }
    };

    document.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [hasShown, isOpen, courseName]); // 4. Adicionamos courseName às dependências

  const generateUniqueCouponCode = () => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 7);
    return `EXIT50-${timestamp}${random}`.toUpperCase();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      exitIntentSchema.parse(formData);
      setSubmitting(true);
      console.log("LOG (ExitIntent): Enviando lead...");

      const novoCodigo = generateUniqueCouponCode();

      const { error: cupomError } = await supabase
        .from("cupons")
        .insert({
          codigo: novoCodigo,
          desconto_percentual: 50,
          tipo: "exit_intent",
          ativo: true,
          uso_maximo: 1,
        });

      if (cupomError) throw cupomError;

      const { error: leadError } = await supabase
        .from("leads_exit_intent")
        .insert({
          nome: formData.nome,
          telefone: formData.telefone,
          cupom_codigo: novoCodigo,
          // (Opcional) Poderíamos salvar o nome do curso aqui também
        });

      if (leadError) throw leadError;

      setCupomCode(novoCodigo);
      setShowCupom(true);
      toast.success("Cupom gerado com sucesso!");
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error("Erro ao gerar cupom");
        console.error(error);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const copyCoupon = () => {
    navigator.clipboard.writeText(cupomCode);
    toast.success("Cupom copiado!");
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        {!showCupom ? (
          <>
            <DialogHeader>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
                <Gift className="h-8 w-8 text-accent" />
              </div>
              <DialogTitle className="text-center text-2xl">
                Espere! Não vá embora ainda 🎁
              </DialogTitle>
              <DialogDescription className="text-center text-base">
                Vimos que você se interessou pelo curso: <br />
                <strong className="text-foreground">{courseName}</strong>
                <br />
                Deixe seu contato e ganhe <span className="font-bold text-accent">50% de desconto</span>!
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div>
                <Label htmlFor="nome">Nome Completo *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Seu nome completo"
                  required
                />
              </div>

              <div>
                <Label htmlFor="telefone">Telefone (WhatsApp) *</Label>
                <Input
                  id="telefone"
                  type="tel"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  placeholder="(11) 98765-4321"
                  required
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-accent hover:bg-accent-light text-accent-foreground font-semibold"
                disabled={submitting}
              >
                {submitting ? "Gerando cupom..." : "Quero meu cupom de 50% OFF!"}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Ao continuar, você concorda em receber comunicações sobre nossos cursos.
              </p>
            </form>
          </>
        ) : (
          <>
            <DialogHeader>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                <Gift className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <DialogTitle className="text-center text-2xl">
                🎉 Parabéns, {formData.nome}!
              </DialogTitle>
              <DialogDescription className="text-center text-base">
                Seu cupom de 50% OFF foi gerado com sucesso!
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              <div className="p-4 bg-muted rounded-lg border-2 border-dashed border-accent">
                <p className="text-xs text-muted-foreground text-center mb-2">Seu código:</p>
                <p className="text-2xl font-bold text-center text-accent tracking-wider">
                  {cupomCode}
                </p>
              </div>

              <Button
                onClick={copyCoupon}
                variant="outline"
                className="w-full"
              >
                Copiar Código
              </Button>

              <div className="text-sm text-center space-y-1">
                <p className="text-muted-foreground">
                  Use este cupom no checkout para obter <span className="font-bold text-accent">50% de desconto</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  Válido para o curso {courseName} • Uso único
                </p>
              </div>

              <Button
                onClick={() => setIsOpen(false)}
                className="w-full bg-accent hover:bg-accent-light text-accent-foreground"
              >
                Continuar no site
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};