import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageCircle, Mail, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CarrinhoAbandonado {
  id: string;
  email: string | null;
  telefone: string | null;
  curso_id: number;
  curso_nome: string | null;
  data_abandono: string;
}

interface AbandonedCartsProps {
  carrinhos: CarrinhoAbandonado[];
}

export const AbandonedCarts = ({ carrinhos }: AbandonedCartsProps) => {
  const handleWhatsApp = (telefone: string, cursoNome: string) => {
    const mensagem = encodeURIComponent(
      `Olá! Notamos que você demonstrou interesse no curso "${cursoNome}". Podemos ajudar com alguma dúvida? 😊`
    );
    const numero = telefone.replace(/\D/g, "");
    window.open(`https://wa.me/55${numero}?text=${mensagem}`, "_blank");
  };

  const handleEmail = (email: string) => {
    window.open(`mailto:${email}`, "_blank");
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Carrinhos Abandonados Recentes</CardTitle>
          <Badge variant="destructive">{carrinhos.length}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {carrinhos.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum carrinho abandonado
            </p>
          ) : (
            carrinhos.map((carrinho) => (
              <div
                key={carrinho.id}
                className="flex items-start justify-between gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium truncate mb-1">
                    {carrinho.curso_nome || "Curso não identificado"}
                  </h4>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    {carrinho.email && (
                      <p className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {carrinho.email}
                      </p>
                    )}
                    {carrinho.telefone && (
                      <p className="flex items-center gap-1">
                        <MessageCircle className="h-3 w-3" />
                        {carrinho.telefone}
                      </p>
                    )}
                    <p className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDistanceToNow(new Date(carrinho.data_abandono), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  {carrinho.telefone && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleWhatsApp(
                          carrinho.telefone!,
                          carrinho.curso_nome || ""
                        )
                      }
                    >
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                  )}
                  {carrinho.email && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEmail(carrinho.email!)}
                    >
                      <Mail className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
