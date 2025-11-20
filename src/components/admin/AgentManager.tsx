import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Save, Edit2, Plus } from "lucide-react";

// 1. Define o schema de validação do formulário
const promptSchema = z.object({
  id: z.string().uuid().optional().nullable(),
  nome_chave: z.string().trim().min(3, "A chave deve ter pelo menos 3 caracteres.")
    .regex(/^[a-z0-9_]+$/, "A chave deve conter apenas letras minúsculas, números e underscore (ex: 'persona_bot')."),
  titulo: z.string().trim().min(5, "O título deve ter pelo menos 5 caracteres."),
  conteudo: z.string().trim().min(10, "O conteúdo do prompt é obrigatório."),
});

type PromptFormValues = z.infer<typeof promptSchema>;

// Define o tipo que vem do Supabase (para a lista)
type AgentPrompt = {
  id: string;
  nome_chave: string;
  titulo: string;
  conteudo: string | null;
  created_at?: string;
};

export const AgentManager = () => {
  const [prompts, setPrompts] = useState<AgentPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // ID do prompt que está sendo editado (ou null para "novo prompt")
  const [editingId, setEditingId] = useState<string | null>(null);

  // 2. Configuração do formulário
  const form = useForm<PromptFormValues>({
    resolver: zodResolver(promptSchema),
    defaultValues: {
      id: null,
      nome_chave: "",
      titulo: "",
      conteudo: "",
    },
  });

  // 3. Função para buscar os prompts do Supabase
  const fetchPrompts = async () => {
    console.log("LOG (AgentManager): Buscando prompts do Supabase...");
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("agent_prompts")
        .select("*")
        .order("titulo", { ascending: true });
      
      if (error) throw error;
      setPrompts(data || []);
      console.log(`LOG (AgentManager): ${data?.length || 0} prompts carregados.`);
    } catch (error: any) {
      toast.error("Erro ao carregar prompts da IA.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // 4. Busca os prompts ao carregar a tela
  useEffect(() => {
    fetchPrompts();
  }, []);

  // 5. Função para Salvar (Criar ou Atualizar)
  const onSubmit = async (values: PromptFormValues) => {
    console.log("LOG (AgentManager): Salvando prompt...", values);
    setIsSaving(true);
    
    // 'upsert' é perfeito: cria se não existe, atualiza se existe
    const { error } = await supabase.from("agent_prompts").upsert({
      id: values.id || undefined, // Se 'id' for null/undefined, o Supabase cria um novo
      nome_chave: values.nome_chave,
      titulo: values.titulo,
      conteudo: values.conteudo,
    });

    setIsSaving(false);

    if (error) {
      toast.error("Erro ao salvar prompt.", { description: error.message });
      console.error("Erro ao salvar:", error);
    } else {
      toast.success(values.id ? "Prompt atualizado!" : "Novo prompt criado!");
      resetForm();
      fetchPrompts(); // Recarrega a lista
    }
  };

  // 6. Função para carregar um prompt no formulário de edição
  const handleEdit = (prompt: AgentPrompt) => {
    console.log(`LOG (AgentManager): Editando prompt: ${prompt.titulo}`);
    setEditingId(prompt.id);
    form.reset({
      id: prompt.id,
      nome_chave: prompt.nome_chave,
      titulo: prompt.titulo,
      conteudo: prompt.conteudo || "",
    });
    window.scrollTo(0, 0); // Rola para o topo (onde está o form)
  };

  // 7. Função para limpar o formulário
  const resetForm = () => {
    setEditingId(null);
    form.reset({
      id: null,
      nome_chave: "",
      titulo: "",
      conteudo: "",
    });
  };

  return (
    <div className="space-y-8">
      {/* Formulário de Criação/Edição */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>{editingId ? "Editando Prompt" : "Criar Novo Prompt"}</CardTitle>
              <CardDescription>
                {editingId 
                  ? "Ajuste o conteúdo do prompt e salve." 
                  : "Crie um novo módulo de prompt para a IA."}
              </CardDescription>
            </div>
            {editingId && (
              <Button variant="outline" size="sm" onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" />
                Criar Novo
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="titulo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título (Amigável)</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: 1. Tom de Voz e Persona" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="nome_chave"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chave (ID do Sistema)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ex: persona_bot" 
                          {...field} 
                          disabled={!!editingId} // Não pode mudar a chave depois de criada
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="conteudo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Conteúdo do Prompt</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Você é um assistente virtual..."
                        {...field}
                        rows={10}
                        className="min-h-[200px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button type="submit" disabled={isSaving}>
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? (editingId ? "Salvando..." : "Criando...") : (editingId ? "Salvar Alterações" : "Criar Prompt")}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Lista de Prompts Existentes */}
      <Card>
        <CardHeader>
          <CardTitle>Prompts Salvos</CardTitle>
          <CardDescription>Estes são os módulos de prompt que o bot está usando.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading && (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          )}
          {!loading && prompts.length === 0 && (
            <p className="text-center text-muted-foreground">Nenhum prompt encontrado.</p>
          )}
          {!loading && prompts.map((prompt) => (
            <div 
              key={prompt.id} 
              className="flex items-center justify-between rounded-lg border p-4"
            >
              <div>
                <p className="font-semibold">{prompt.titulo}</p>
                <p className="text-sm text-muted-foreground">
                  Chave: <code className="bg-muted px-1 rounded-sm">{prompt.nome_chave}</code>
                </p>
              </div>
              <Button variant="outline" size="icon" onClick={() => handleEdit(prompt)}>
                <Edit2 className="h-4 w-4" />
                <span className="sr-only">Editar</span>
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};