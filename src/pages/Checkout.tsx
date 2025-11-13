import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Shield, CreditCard, Smartphone, Barcode } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const checkoutSchema = z.object({
  nome: z.string().trim().min(3, "Nome deve ter pelo menos 3 caracteres").max(100, "Nome muito longo"),
  email: z.string().trim().email("Email inválido").max(255, "Email muito longo"),
  telefone: z.string().trim().min(10, "Telefone inválido").max(20, "Telefone inválido"),
  cpf: z.string().trim().min(11, "CPF inválido").max(14, "CPF inválido"),
});

interface Curso {
  id: number;
  "Nome dos cursos": string | null;
  "Preço Pix / Valor para Cadastro": string | null;
  "Preço Cartão / Valor para Cadastro": string | null;
  "Preço Boleto / Valor para Cadastro": string | null;
  ImagemCapa: string | null;
}

const Checkout = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [curso, setCurso] = useState<Curso | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    telefone: "",
    cpf: "",
    formaPagamento: "pix",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (id) {
      fetchCurso();
      
      // Registrar abandono de carrinho após 30 segundos
      const abandonTimer = setTimeout(() => {
        if (formData.email || formData.telefone) {
          registrarAbandonoCarrinho();
        }
      }, 30000);

      return () => clearTimeout(abandonTimer);
    }
  }, [id]);

  const fetchCurso = async () => {
    try {
      const { data, error } = await supabase
        .from("cursos")
        .select("*")
        .eq("id", parseInt(id!))
        .single();

      if (error) throw error;
      setCurso(data);
    } catch (error: any) {
      toast.error("Erro ao carregar curso");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const registrarAbandonoCarrinho = async () => {
    try {
      await supabase.from("carrinhos_abandonados").insert({
        email: formData.email || null,
        telefone: formData.telefone || null,
        curso_id: parseInt(id!),
      });
    } catch (error) {
      console.error("Erro ao registrar abandono:", error);
    }
  };

  const getPreco = () => {
    if (!curso) return null;
    
    switch (formData.formaPagamento) {
      case "pix":
        return curso["Preço Pix / Valor para Cadastro"];
      case "cartao":
        return curso["Preço Cartão / Valor para Cadastro"];
      case "boleto":
        return curso["Preço Boleto / Valor para Cadastro"];
      default:
        return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      // Validação
      checkoutSchema.parse(formData);

      setSubmitting(true);

      // Salvar matrícula
      const { error } = await supabase.from("matriculas").insert({
        curso_id: parseInt(id!),
        aluno_nome: formData.nome,
        aluno_email: formData.email,
        aluno_telefone: formData.telefone,
        aluno_cpf: formData.cpf,
        forma_pagamento: formData.formaPagamento,
        valor_pago: getPreco() || "Consultar",
      });

      if (error) throw error;

      toast.success("Matrícula realizada com sucesso!", {
        description: "Você receberá um email com as instruções.",
      });

      // Redirecionar após sucesso
      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
        toast.error("Por favor, corrija os erros no formulário");
      } else {
        toast.error("Erro ao processar matrícula");
        console.error(error);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-pulse text-lg">Carregando...</div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!curso) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Curso não encontrado</h2>
            <Button onClick={() => navigate("/cursos")}>Ver todos os cursos</Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Finalizar Matrícula</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Formulário */}
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit} className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Dados Pessoais</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="nome">Nome Completo *</Label>
                      <Input
                        id="nome"
                        value={formData.nome}
                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                        placeholder="Seu nome completo"
                        className={errors.nome ? "border-destructive" : ""}
                      />
                      {errors.nome && <p className="text-sm text-destructive mt-1">{errors.nome}</p>}
                    </div>

                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="seu@email.com"
                        className={errors.email ? "border-destructive" : ""}
                      />
                      {errors.email && <p className="text-sm text-destructive mt-1">{errors.email}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="telefone">Telefone (WhatsApp) *</Label>
                        <Input
                          id="telefone"
                          type="tel"
                          value={formData.telefone}
                          onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                          placeholder="(11) 98765-4321"
                          className={errors.telefone ? "border-destructive" : ""}
                        />
                        {errors.telefone && <p className="text-sm text-destructive mt-1">{errors.telefone}</p>}
                      </div>

                      <div>
                        <Label htmlFor="cpf">CPF *</Label>
                        <Input
                          id="cpf"
                          value={formData.cpf}
                          onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                          placeholder="000.000.000-00"
                          className={errors.cpf ? "border-destructive" : ""}
                        />
                        {errors.cpf && <p className="text-sm text-destructive mt-1">{errors.cpf}</p>}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Forma de Pagamento</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup
                      value={formData.formaPagamento}
                      onValueChange={(value) => setFormData({ ...formData, formaPagamento: value })}
                    >
                      <div className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50">
                        <RadioGroupItem value="pix" id="pix" />
                        <Label htmlFor="pix" className="flex-1 cursor-pointer flex items-center">
                          <Smartphone className="mr-3 h-5 w-5 text-primary" />
                          <div>
                            <p className="font-medium">Pix</p>
                            <p className="text-sm text-muted-foreground">
                              {curso["Preço Pix / Valor para Cadastro"] || "Consulte"}
                            </p>
                          </div>
                        </Label>
                      </div>

                      <div className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50">
                        <RadioGroupItem value="cartao" id="cartao" />
                        <Label htmlFor="cartao" className="flex-1 cursor-pointer flex items-center">
                          <CreditCard className="mr-3 h-5 w-5 text-primary" />
                          <div>
                            <p className="font-medium">Cartão de Crédito</p>
                            <p className="text-sm text-muted-foreground">
                              {curso["Preço Cartão / Valor para Cadastro"] || "Consulte"}
                            </p>
                          </div>
                        </Label>
                      </div>

                      <div className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50">
                        <RadioGroupItem value="boleto" id="boleto" />
                        <Label htmlFor="boleto" className="flex-1 cursor-pointer flex items-center">
                          <Barcode className="mr-3 h-5 w-5 text-primary" />
                          <div>
                            <p className="font-medium">Boleto Bancário</p>
                            <p className="text-sm text-muted-foreground">
                              {curso["Preço Boleto / Valor para Cadastro"] || "Consulte"}
                            </p>
                          </div>
                        </Label>
                      </div>
                    </RadioGroup>
                  </CardContent>
                </Card>

                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Shield className="h-4 w-4" />
                  <p>Seus dados estão seguros e protegidos</p>
                </div>

                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full bg-accent hover:bg-accent-light text-accent-foreground font-semibold"
                  disabled={submitting}
                >
                  {submitting ? "Processando..." : "Confirmar Matrícula"}
                </Button>
              </form>
            </div>

            {/* Resumo */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <Card>
                  <CardHeader>
                    <CardTitle>Resumo do Pedido</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {curso.ImagemCapa && (
                      <img
                        src={curso.ImagemCapa}
                        alt={curso["Nome dos cursos"] || "Curso"}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                    )}

                    <div>
                      <h3 className="font-semibold line-clamp-2">{curso["Nome dos cursos"]}</h3>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>{getPreco() || "Consulte"}</span>
                      </div>
                      <div className="flex justify-between font-semibold">
                        <span>Total</span>
                        <span className="text-primary">{getPreco() || "Consulte"}</span>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2 text-xs text-muted-foreground">
                      <p>✓ Certificado reconhecido pelo MEC</p>
                      <p>✓ Material didático incluso</p>
                      <p>✓ Suporte especializado</p>
                      <p>✓ Política de cancelamento em até 7 dias</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Checkout;
