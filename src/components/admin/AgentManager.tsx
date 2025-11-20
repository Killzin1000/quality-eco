import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch"; 
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Save, Edit2, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils"; // <--- O ERRO ESTAVA AQUI (Faltava essa linha)

const promptSchema = z.object({
  id: z.string().uuid().optional().nullable(),
  nome_chave: z.string().trim().min(3, "Chave obrigatória (ex: 'persona')."),
  titulo: z.string().trim().min(5, "Título obrigatório."),
  conteudo: z.string().trim().min(10, "Conteúdo obrigatório."),
  ordem: z.coerce.number().min(0, "A ordem deve ser um número positivo."),
  ativo: z.boolean().default(true),
});

type PromptFormValues = z.infer<typeof promptSchema>;

type AgentPrompt = {
  id: string;
  nome_chave: string;
  titulo: string;
  conteudo: string | null;
  ordem: number;
  ativo: boolean;
};

export const AgentManager = () => {
  const [prompts, setPrompts] = useState<AgentPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const form = useForm<PromptFormValues>({
    resolver: zodResolver(promptSchema),
    defaultValues: {
      id: null,
      nome_chave: "",
      titulo: "",
      conteudo: "",
      ordem: 10, 
      ativo: true,
    },
  });

  const fetchPrompts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("agent_prompts")
        .select("*")
        .order("ordem", { ascending: true });
      
      if (error) throw error;
      setPrompts(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar prompts.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrompts();
  }, []);

  const onSubmit = async (values: PromptFormValues) => {
    setIsSaving(true);
    const { error } = await supabase.from("agent_prompts").upsert({
      id: values.id || undefined,
      nome_chave: values.nome_chave,
      titulo: values.titulo,
      conteudo: values.conteudo,
      ordem: values.ordem,
      ativo: values.ativo,
    });

    setIsSaving(false);

    if (error) {
      toast.error("Erro ao salvar.", { description: error.message });
    } else {
      toast.success(values.id ? "Prompt atualizado!" : "Novo prompt criado!");
      resetForm();
      fetchPrompts();
    }
  };

  const handleEdit = (prompt: AgentPrompt) => {
    setEditingId(prompt.id);
    form.reset({
      id: prompt.id,
      nome_chave: prompt.nome_chave,
      titulo: prompt.titulo,
      conteudo: prompt.conteudo || "",
      ordem: prompt.ordem,
      ativo: prompt.ativo,
    });
    window.scrollTo(0, 0);
  };

  const resetForm = () => {
    setEditingId(null);
    form.reset({
      id: null,
      nome_chave: "",
      titulo: "",
      conteudo: "",
      ordem: 10,
      ativo: true,
    });
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>{editingId ? "Editando Módulo" : "Criar Novo Módulo de IA"}</CardTitle>
              <CardDescription>
                Defina as regras, a ordem de prioridade e o conteúdo.
              </CardDescription>
            </div>
            {editingId && (
              <Button variant="outline" size="sm" onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" />
                Cancelar Edição
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="titulo"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Título (Identificação)</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Regras de Cancelamento" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ordem"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ordem (Prioridade)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormDescription>Menor número aparece primeiro.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="nome_chave"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chave Única (ID)</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: politica_cancelamento" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ativo"
                  render={({ field }) => (
                    <FormItem className="flex flex-col gap-2 mt-2">
                       <FormLabel>Status do Módulo</FormLabel>
                       <div className="flex items-center space-x-2">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <span>{field.value ? "Ativo (IA vai ler)" : "Inativo (IA ignora)"}</span>
                       </div>
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
                        placeholder="Digite as instruções para a IA aqui..."
                        {...field}
                        rows={10}
                        className="font-mono text-sm"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button type="submit" disabled={isSaving}>
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? "Salvando..." : "Salvar Módulo"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        <h3 className="text-lg font-semibold">Módulos Ativos (Ordem de Leitura)</h3>
        {loading && <Skeleton className="h-12 w-full" />}
        {!loading && prompts.length === 0 && (
          <p className="text-center text-muted-foreground">Nenhum prompt encontrado.</p>
        )}
        {!loading && prompts.map((prompt) => (
          <div 
            key={prompt.id} 
            className={cn(
              "flex items-center justify-between rounded-lg border p-4 transition-all",
              !prompt.ativo && "opacity-50 bg-muted"
            )}
          >
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center text-base">
                {prompt.ordem}
              </Badge>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold">{prompt.titulo}</p>
                  {!prompt.ativo && <Badge variant="destructive" className="text-xs">Inativo</Badge>}
                </div>
                <p className="text-xs text-muted-foreground font-mono">
                  {prompt.nome_chave}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => handleEdit(prompt)}>
              <Edit2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};