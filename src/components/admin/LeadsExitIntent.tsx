import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageCircle, Gift, Calendar, CheckCircle, XCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Lead {
  id: string;
  nome: string;
  telefone: string;
  cupom_codigo: string | null;
  cupom_usado: boolean;
  created_at: string;
}

interface LeadsExitIntentProps {
  leads: Lead[];
}

export const LeadsExitIntent = ({ leads }: LeadsExitIntentProps) => {
  const handleWhatsApp = (telefone: string, nome: string, cupom: string | null) => {
    const mensagem = encodeURIComponent(
      `Olá ${nome}! Seu cupom ${cupom} de 50% OFF está ativo! Não perca essa oportunidade incrível. Escolha seu curso agora! 🎓✨`
    );
    const numero = telefone.replace(/\D/g, "");
    window.open(`https://wa.me/55${numero}?text=${mensagem}`, "_blank");
  };

  const leadsUsados = leads.filter((l) => l.cupom_usado).length;
  const taxaUso = leads.length > 0 ? (leadsUsados / leads.length) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Leads Exit-Intent</CardTitle>
          <div className="flex gap-2">
            <Badge variant="secondary">{leads.length} total</Badge>
            <Badge variant={taxaUso > 20 ? "default" : "outline"}>
              {taxaUso.toFixed(0)}% conversão
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {leads.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum lead capturado ainda
            </p>
          ) : (
            leads.map((lead) => (
              <div
                key={lead.id}
                className="flex items-start justify-between gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium">{lead.nome}</h4>
                    {lead.cupom_usado ? (
                      <Badge variant="default" className="gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Usado
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1">
                        <XCircle className="h-3 w-3" />
                        Não usado
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p className="flex items-center gap-1">
                      <MessageCircle className="h-3 w-3" />
                      {lead.telefone}
                    </p>
                    {lead.cupom_codigo && (
                      <p className="flex items-center gap-1">
                        <Gift className="h-3 w-3" />
                        <code className="bg-muted px-2 py-0.5 rounded text-xs">
                          {lead.cupom_codigo}
                        </code>
                      </p>
                    )}
                    <p className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDistanceToNow(new Date(lead.created_at), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                </div>
                {!lead.cupom_usado && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      handleWhatsApp(lead.telefone, lead.nome, lead.cupom_codigo)
                    }
                  >
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
