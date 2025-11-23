import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bot, User, AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

interface ChatMessage {
  id: string;
  session_id: string;
  role: string;
  content: string;
  created_at: string;
}

export const ChatMonitor = () => {
  const [sessions, setSessions] = useState<string[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  // 1. Buscar sessões ativas (agrupando mensagens)
  const fetchSessions = async () => {
    setLoading(true);
    try {
      // Hack para pegar sessões únicas usando RPC ou processamento no cliente
      // Como não criamos uma view de sessões de chat, vamos buscar as últimas 100 msgs e agrupar
      const { data, error } = await supabase
        .from("chat_messages")
        .select("session_id, created_at")
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) throw error;

      // Extrair IDs únicos mantendo a ordem de recência
      const uniqueSessions = Array.from(new Set(data?.map(m => m.session_id)));
      setSessions(uniqueSessions);
      
      if (!selectedSession && uniqueSessions.length > 0) {
        setSelectedSession(uniqueSessions[0]);
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

  useEffect(() => {
    fetchSessions();
    
    // Configurar Realtime para atualizar quando novas mensagens chegarem
    const channel = supabase
      .channel('chat-monitor')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        (payload) => {
          // Se a mensagem for da sessão aberta, atualiza a lista
          if (selectedSession === payload.new.session_id) {
            setMessages((prev) => [...prev, payload.new as ChatMessage]);
          }
          // Se for nova sessão ou atualização, poderia re-buscar a lista de sessões
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedSession]);

  // Quando muda a seleção
  useEffect(() => {
    if (selectedSession) {
      fetchMessages(selectedSession);
    }
  }, [selectedSession]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[600px]">
      {/* Lista de Sessões */}
      <Card className="md:col-span-1 flex flex-col">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Conversas Recentes</CardTitle>
          <Button variant="ghost" size="icon" onClick={fetchSessions} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden p-0">
          <ScrollArea className="h-full">
            <div className="flex flex-col p-2 gap-1">
              {sessions.map((sessionId) => (
                <button
                  key={sessionId}
                  onClick={() => setSelectedSession(sessionId)}
                  className={`flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                    selectedSession === sessionId
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-muted"
                  }`}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{sessionId.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 overflow-hidden">
                    <p className="font-medium truncate">{sessionId}</p>
                    <p className="text-xs opacity-70 truncate">Clique para ver histórico</p>
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

      {/* Janela de Chat */}
      <Card className="md:col-span-2 flex flex-col">
        <CardHeader className="pb-2 border-b">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bot className="h-5 w-5 text-primary" />
            Monitoramento: <span className="text-primary">{selectedSession}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden p-0 bg-slate-50 dark:bg-slate-900/50">
          <ScrollArea className="h-full p-4">
            <div className="space-y-4">
              {messages.map((msg) => {
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
                      <p className="whitespace-pre-wrap">{msg.content}</p>
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
              {messages.length === 0 && (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  Selecione uma conversa para visualizar
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};