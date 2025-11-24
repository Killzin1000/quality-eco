import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardDescription, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, ShoppingBag, AlertCircle, Info } from "lucide-react";
import { toast } from "sonner";

// Tipos que serão tratados automaticamente (pós-matrícula)
const TIPOS_POS_MATRICULA = ["Extensão", "Artigo"];

// Tipos baseados no seu banco
interface Pacote {
  id: string;
  titulo: string;
  descricao: string | null;
  preco_pix: string | null;
  preco_cartao: string | null;
  imagem_capa: string | null;
  regras: RegraPacote[];
}

interface RegraPacote {
  tipo: string; 
  quantidade: number;
  texto: string; 
}

interface CursoSimples {
  id: number;
  "Nome dos cursos": string;
}

export default function Packages() {
  const [pacotes, setPacotes] = useState<Pacote[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState<Pacote | null>(null);
  
  const [cursosDisponiveis, setCursosDisponiveis] = useState<Record<string, CursoSimples[]>>({});
  const [selecoes, setSelecoes] = useState<Record<string, string>>({}); 
  const [saving, setSaving] = useState(false);
  
  useEffect(() => {
    fetchPacotes();
  }, []);

  const fetchPacotes = async () => {
    try {
      const { data, error } = await supabase
        .from("pacotes")
        .select("*")
        .eq("ativo", true);

      if (error) throw error;
      
      setPacotes((data as any[]) || []);
    } catch (error) {
      console.error("Erro ao buscar pacotes:", error);
      toast.error("Erro ao carregar pacotes.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenBuilder = async (pacote: Pacote) => {
    setSelectedPackage(pacote);
    setSelecoes({}); 
    
    // Filtra apenas os tipos que PRECISAM ser escolhidos agora
    const tiposNecessarios = Array.from(new Set(
      pacote.regras
        .filter(r => !TIPOS_POS_MATRICULA.includes(r.tipo))
        .map(r => r.tipo)
    ));
    
    const cursosPorTipo: Record<string, CursoSimples[]> = {};
    
    try {
      await Promise.all(tiposNecessarios.map(async (tipo) => {
        // Bypass de tipagem para evitar erro 2589
        const { data } = await (supabase as any)
          .from("cursos")
          .select('id, "Nome dos cursos"')
          .eq('"Tipo"', tipo)
          .limit(100); 
          
        if (data) {
          cursosPorTipo[tipo] = data.map((c: any) => ({ 
            id: c.id, 
            "Nome dos cursos": c["Nome dos cursos"] || "Sem nome" 
          }));
        }
      }));
      
      setCursosDisponiveis(cursosPorTipo);
    } catch (error) {
      console.error("Erro ao buscar cursos para o combo:", error);
      toast.error("Erro ao carregar as opções de curso.");
    }
  };

  const handleSelectionChange = (ruleIndex: number, itemIndex: number, cursoId: string) => {
    const key = `${ruleIndex}_${itemIndex}`;
    setSelecoes(prev => ({ ...prev, [key]: cursoId }));
  };

  const handleSubmitCombo = async () => {
    if (!selectedPackage) return;

    // Validação: Conta apenas os slots que NÃO são automáticos
    let slotsObrigatorios = 0;
    selectedPackage.regras.forEach(r => {
      if (!TIPOS_POS_MATRICULA.includes(r.tipo)) {
        slotsObrigatorios += r.quantidade;
      }
    });
    
    if (Object.keys(selecoes).length < slotsObrigatorios) {
      toast.warning("Por favor, selecione os cursos principais antes de continuar.");
      return;
    }

    setSaving(true);
    try {
      // Monta a lista de nomes dos cursos escolhidos
      const cursosEscolhidosNomes = Object.values(selecoes).map(id => {
        for (const tipo in cursosDisponiveis) {
          const found = cursosDisponiveis[tipo].find(c => c.id.toString() === id);
          if (found) return found["Nome dos cursos"];
        }
        return "Curso ID " + id;
      });

      // Adiciona os itens automáticos na mensagem
      const itensAutomaticos = selectedPackage.regras
        .filter(r => TIPOS_POS_MATRICULA.includes(r.tipo))
        .map(r => `🎁 ${r.quantidade}x ${r.tipo} (Escolha no Portal)`);

      const mensagem = `Olá! Quero fechar o pacote *${selectedPackage.titulo}*!\n\n` +
                       `*Minhas escolhas:*\n` + 
                       cursosEscolhidosNomes.map(n => `✅ ${n}`).join("\n") +
                       (itensAutomaticos.length > 0 ? `\n\n*Bônus Inclusos:*\n` + itensAutomaticos.join("\n") : "");
      
      const linkZap = `https://wa.me/5511987654321?text=${encodeURIComponent(mensagem)}`;
      
      window.open(linkZap, '_blank');
      toast.success("Redirecionando para o consultor finalizar sua matrícula!");
      
    } catch (error) {
      console.error(error);
      toast.error("Erro ao processar o combo.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-secondary/30">
      <Navbar />

      <main className="container mx-auto px-4 py-12 flex-1">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4 px-4 py-1 text-sm">Economia Inteligente</Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
            Pacotes & Combos Especiais
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Estude mais, pague menos. Escolha o combo ideal para acelerar sua carreira.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {pacotes.map((pacote) => (
              <Card key={pacote.id} className="flex flex-col hover:shadow-xl transition-all duration-300 border-primary/10 overflow-hidden">
                <div className="h-48 overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10 flex items-end p-6">
                    <h3 className="text-white font-bold text-xl">{pacote.titulo}</h3>
                  </div>
                  <img 
                    src={pacote.imagem_capa || "/placeholder.svg"} 
                    alt={pacote.titulo} 
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                </div>
                
                <CardHeader>
                  <CardDescription className="text-base">
                    {pacote.descricao}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="flex-1 space-y-4">
                  <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                    <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">O que inclui:</p>
                    <ul className="space-y-2">
                      {pacote.regras.map((regra, idx) => (
                        <li key={idx} className="flex items-center text-sm">
                          <CheckCircle2 className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                          <span>{regra.quantidade}x {regra.tipo}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>

                <CardFooter className="flex flex-col gap-4 bg-muted/30 pt-6">
                  <div className="w-full flex justify-between items-center">
                    <div className="text-left">
                      <p className="text-xs text-muted-foreground line-through">Valor Original: Consulte</p>
                      <p className="text-2xl font-bold text-primary">
                        R$ {pacote.preco_pix} <span className="text-sm font-normal text-muted-foreground">à vista</span>
                      </p>
                    </div>
                    <Badge variant="outline" className="border-accent text-accent-foreground">
                      Melhor Custo
                    </Badge>
                  </div>
                  
                  <Button 
                    size="lg" 
                    className="w-full bg-primary hover:bg-primary-glow shadow-lg shadow-primary/20"
                    onClick={() => handleOpenBuilder(pacote)}
                  >
                    <ShoppingBag className="mr-2 h-4 w-4" />
                    Montar meu Combo
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* MODAL CONSTRUTOR DE COMBOS */}
      <Dialog open={!!selectedPackage} onOpenChange={(open) => !open && setSelectedPackage(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Monte seu {selectedPackage?.titulo}</DialogTitle>
            <DialogDescription>
              Personalize seu pacote. Alguns itens você escolherá diretamente na plataforma após a matrícula.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {selectedPackage?.regras.map((regra, regraIndex) => {
              const isPosMatricula = TIPOS_POS_MATRICULA.includes(regra.tipo);

              return (
                <div key={regraIndex} className="space-y-3 border-b pb-4 last:border-0">
                  <div className="flex items-center gap-2">
                    <Badge variant={isPosMatricula ? "secondary" : "default"}>
                      {regra.tipo}
                    </Badge>
                    <span className="text-sm text-muted-foreground font-medium">
                      {regra.quantidade} item(ns)
                    </span>
                  </div>

                  {/* LÓGICA CONDICIONAL DE RENDERIZAÇÃO */}
                  {isPosMatricula ? (
                    <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-100 dark:border-blue-800">
                      <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                      <div className="text-sm text-blue-800 dark:text-blue-200">
                        <p className="font-semibold">Seleção no Portal do Aluno</p>
                        <p className="opacity-90">
                          Você poderá escolher seus {regra.quantidade} títulos de <strong>{regra.tipo}</strong> com calma após a liberação do seu acesso.
                        </p>
                      </div>
                    </div>
                  ) : (
                    // Renderiza os Selects normais para cursos principais
                    Array.from({ length: regra.quantidade }).map((_, itemIndex) => {
                      const key = `${regraIndex}_${itemIndex}`;
                      const cursosDoTipo = cursosDisponiveis[regra.tipo] || [];

                      return (
                        <div key={itemIndex} className="pl-2 border-l-2 border-muted ml-2">
                          {/* LÓGICA DE NUMERAÇÃO DO RÓTULO */}
                          <Label className="mb-2 block text-xs uppercase text-muted-foreground">
                            {regra.quantidade > 1 
                              ? `${itemIndex + 1}ª ${regra.texto || "Opção"}` 
                              : regra.texto || "Opção Única"}
                          </Label>
                          
                          {cursosDoTipo.length > 0 ? (
                            <Select 
                              onValueChange={(val) => handleSelectionChange(regraIndex, itemIndex, val)}
                              value={selecoes[key]}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder={`Escolha um curso de ${regra.tipo}...`} />
                              </SelectTrigger>
                              <SelectContent>
                                {cursosDoTipo.map((curso) => (
                                  <SelectItem key={curso.id} value={curso.id.toString()}>
                                    {curso["Nome dos cursos"]}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <div className="flex items-center gap-2 text-amber-600 text-sm p-2 bg-amber-50 rounded">
                              <AlertCircle className="h-4 w-4" />
                              <span>Carregando opções de {regra.tipo}...</span>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              );
            })}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setSelectedPackage(null)}>Cancelar</Button>
            <Button onClick={handleSubmitCombo} disabled={saving} className="bg-green-600 hover:bg-green-700">
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Gerando Pedido...
                </>
              ) : (
                <>
                  <WhatsAppButton /> Finalizar no WhatsApp
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
      <WhatsAppButton />
    </div>
  );
}