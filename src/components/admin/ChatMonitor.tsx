import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bot, User, AlertTriangle, RefreshCw, BookOpen, GraduationCap, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

// Interface para as informações do Cliente
interface ClientProfile {
  nome_cliente: string;
  formacao_cliente: string | null;
  tipo_formacao: string | null;
  area_preferencial: string | null;
  curso_contexto: string | null;
  // Nova propriedade para o último timestamp, usada para ordenação
  last_message_at: string; 
}

interface ChatMessage {
  id: string;
  session_id: string;
  role: string;
  content: string;
  created_at: string;
}

export const ChatMonitor = () => {
  const [sessions, setSessions] = useState<ClientProfile[]>([]); // Agora armazena ClientProfile
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [clientProfile, setClientProfile] = useState<ClientProfile | null>(null);
  const [loading, setLoading] = useState(false);

  // Função auxiliar para extrair o perfil (contexto) a partir do histórico
  const fetchSessionProfile = useCallback(async (sessionId: string) => {
    // Busca as últimas 20 mensagens para tentar pegar o contexto mais recente
    const { data: msgs } = await supabase
      .from("chat_messages")
      .select("content, created_at")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false })
      .limit(20);

    let profile: ClientProfile = {
      nome_cliente: "Visitante",
      formacao_cliente: null,
      tipo_formacao: null,
      area_preferencial: null,
      curso_contexto: null,
      last_message_at: msgs?.[0]?.created_at || new Date().toISOString(),
    };

    // Itera as últimas mensagens para tentar reconstruir o contexto
    for (const msg of msgs || []) {
        // Tenta encontrar o bloco de dados do curso injetado pelo backend
      const matchCursoContexto = msg.content.match(/\[DADOS_CURSO_ENCONTRADO:\s*(.*?)\]/);
      if (matchCursoContexto && !profile.curso_contexto) {
        profile.curso_contexto = matchCursoContexto[1].trim();
      }
      
      // Tenta encontrar o nome do cliente (o backend envia o nome do cliente no content do HIDDEN se estiver atualizado)
      const matchNome = msg.content.match(/^- \*\*Nome:\*\* (.*?)\n/m);
      if (matchNome && profile.nome_cliente === "Visitante" && matchNome[1] !== "visitante") {
          profile.nome_cliente = matchNome[1].trim();
      }

      // Se encontrarmos o contexto do curso e o nome, podemos parar (otimização)
      if (profile.curso_contexto !== null && profile.nome_cliente !== "Visitante") {
          break;
      }
    }
    
    // Se o nome ainda for "Visitante" e o session_id não for um UUID, usa o session_id como nome
    if (profile.nome_cliente === "Visitante" && !sessionId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      profile.nome_cliente = sessionId;
    }

    return profile;
  }, []);

  // 1. Buscar sessões ativas (agrupando mensagens)
  const fetchSessions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("session_id, created_at")
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) throw error;

      // Agrupa e pega o timestamp mais recente para cada session_id
      const recentSessionsMap = new Map<string, string>();
      data?.forEach(m => {
          if (!recentSessionsMap.has(m.session_id)) {
              recentSessionsMap.set(m.session_id, m.created_at);
          }
      });
      
      const uniqueSessionIds = Array.from(recentSessionsMap.keys());
      const profilesPromises = uniqueSessionIds.map(id => fetchSessionProfile(id));
      const profiles = await Promise.all(profilesPromises);
      
      // Atualiza o estado das sessões com os perfis encontrados
      setSessions(profiles.sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()));
      
      if (!selectedSessionId && profiles.length > 0) {
        setSelectedSessionId(profiles[0].nome_cliente); // Usando o nome_cliente/ID como o selecionado
        setClientProfile(profiles[0]);
      } else if (selectedSessionId) {
        // Se já tinha um selecionado, atualiza o perfil desse
        const currentProfile = profiles.find(p => p.nome_cliente === selectedSessionId);
        if(currentProfile) setClientProfile(currentProfile);
      }
      
    } catch (error) {
      console.error("Erro ao buscar sessões:", error);
    } finally {
      setLoading(false);
    }
  };

  // 2. Buscar mensagens da sessão selecionada
  const fetchMessages = async (sessionId: string) => {
    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });

    if (error) console.error("Erro ao buscar mensagens:", error);
    else setMessages(data || []);
  };

  // Efeito principal: carrega sessões e, se mudar a sessão, carrega mensagens e perfil
  useEffect(() => {
    fetchSessions();
    
    // Garante que o Realtime funciona (requer RLS configurado)
    const channel = supabase
      .channel('chat-monitor')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        (payload) => {
          if (selectedSessionId === payload.new.session_id) {
            // Se a mensagem for visível, atualiza o chat
            if (!payload.new.content.startsWith("HIDDEN:")) {
              setMessages((prev) => [...prev, payload.new as ChatMessage]);
            }
            // Atualiza o perfil para pegar o novo contexto/nome
            fetchSessionProfile(selectedSessionId);
          }
          // Se for nova sessão, atualiza a lista de sessões
          fetchSessions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedSessionId, fetchSessionProfile]);

  // Quando muda a seleção
  const handleSessionSelect = async (profile: ClientProfile) => {
      setSelectedSessionId(profile.nome_cliente);
      setClientProfile(profile);
      await fetchMessages(profile.nome_cliente); // Usamos o nome_cliente como ID da sessão
  };

  // Filtra mensagens HIDDEN para o display
  const messagesToDisplay = messages.filter(
    (msg) => !msg.content.startsWith("HIDDEN:") && !msg.content.startsWith("[DADOS_CURSO_ENCONTRADO:")
  );
  
  // Exibe o último bloco de contexto (HIDDEN) para debug do Admin
  const lastHiddenBlock = messages
    .map(msg => msg.content)
    .reverse()
    .find(content => content.startsWith("HIDDEN:"));

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[750px]">
      {/* Coluna 1: Lista de Sessões */}
      <Card className="md:col-span-1 flex flex-col">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Conversas Recentes</CardTitle>
          <CardDescription>Clique para inspecionar o contexto da IA.</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden p-0">
          <ScrollArea className="h-full">
            <div className="flex flex-col p-2 gap-1">
              {sessions.map((profile) => (
                <button
                  key={profile.nome_cliente}
                  onClick={() => handleSessionSelect(profile)}
                  className={`flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                    selectedSessionId === profile.nome_cliente
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-muted"
                  }`}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{profile.nome_cliente.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 overflow-hidden">
                    <p className="font-medium truncate">{profile.nome_cliente}</p>
                    <p className="text-xs opacity-70 truncate">
                      {profile.curso_contexto ? `Contexto: ${profile.curso_contexto}` : 'Sem contexto de curso'}
                    </p>
                  </div>
                </button>
              ))}
              {sessions.length === 0 && (
                <p className="text-center text-muted-foreground p-4">Nenhuma conversa encontrada.</p>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
      
      {/* Coluna 2: Janela de Chat e Contexto */}
      <Card className="md:col-span-2 flex flex-col">
        <CardHeader className="pb-2 border-b flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
                <Bot className="h-5 w-5 text-primary" />
                Monitoramento: <span className="text-primary truncate max-w-[150px] sm:max-w-none">{selectedSessionId}</span>
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={fetchSessions} disabled={loading}>
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
        </CardHeader>
        
        <CardContent className="overflow-hidden p-0 bg-slate-50 dark:bg-slate-900/50">
          {/* 2.1: Chat History */}
          <ScrollArea className="h-[350px] p-4 border-b">
            <div className="space-y-4">
              {messagesToDisplay.map((msg) => {
                const isBot = msg.role === "assistant";
                const isError = msg.role === "system_error";
                
                return (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${isBot || isError ? "justify-start" : "justify-end"}`}
                  >
                    {(isBot || isError) && (
                      <Avatar className="h-8 w-8 bg-primary text-primary-foreground">
                        <AvatarFallback>
                           {isError ? <AlertTriangle className="h-4 w-4 text-yellow-200" /> : <Bot className="h-4 w-4" />}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    
                    <div
                      className={`rounded-lg p-3 max-w-[80%] text-sm ${
                        isError 
                          ? "bg-destructive text-destructive-foreground border border-red-500"
                          : isBot
                          ? "bg-white border border-border dark:bg-slate-800"
                          : "bg-primary text-primary-foreground"
                      }`}
                    >
                      {/* Corrigindo a exibição do conteúdo para HTML */}
                      <div 
                        dangerouslySetInnerHTML={{ __html: msg.content.replace(/\n/g, '<br />') }} 
                        className="leading-relaxed whitespace-pre-wrap"
                      />
                      <p className="text-[10px] opacity-50 mt-1 text-right">
                        {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true, locale: ptBR })}
                      </p>
                    </div>

                    {!isBot && !isError && (
                      <Avatar className="h-8 w-8 bg-muted">
                        <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                );
              })}
              {messagesToDisplay.length === 0 && (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  Selecione uma conversa para visualizar
                </div>
              )}
            </div>
          </ScrollArea>
          
          {/* 2.2: Etiquetas e Contexto */}
          <div className="p-4 flex flex-col gap-3">
              <h4 className="font-semibold text-base flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-green-600" />
                  Etiquetas de Contexto da IA (Perfil)
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Nome/ID:</span> {clientProfile?.nome_cliente || selectedSessionId}
                  </div>
                  <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Curso em Foco:</span>
                      <Badge variant="secondary" className="truncate max-w-[150px]">
                          {clientProfile?.curso_contexto || "Nenhum"}
                      </Badge>
                  </div>
                  {/* Outras etiquetas (Formação, etc) viriam aqui se as resgatassemos, mas por agora, foco no curso */}
              </div>
          </div>
          
          {/* 2.3: Bloco HIDDEN de Debug */}
          {lastHiddenBlock && (
              <ScrollArea className="h-32 w-full border-t p-4 bg-gray-100 dark:bg-gray-800">
                  <h4 className="font-semibold text-sm mb-2 text-red-500">
                      DEBUG: Último Bloco [DADOS_CURSO_ENCONTRADO]
                  </h4>
                  <pre className="text-xs text-wrap overflow-auto font-mono">
                      {lastHiddenBlock.replace("HIDDEN:", "").trim()}
                  </pre>
              </ScrollArea>
          )}

        </CardContent>
      </Card>
    </div>
  );
};