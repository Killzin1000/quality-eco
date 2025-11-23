import { useEffect, useRef, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Send, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useChat } from "@/ChatProvider";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export const AiChatWidget = () => {
  const { session, handleSend, isLoading, isBotTyping } = useChat();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [session.historico, isBotTyping]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    handleSend(input);
    setInput("");
  };

  // --- CORREÇÃO 1: Filtrar mensagens ocultas ---
  const mensagensVisiveis = session.historico.filter(
    (msg) => !msg.content.startsWith("HIDDEN:")
  );

  return (
    <div className="h-full flex flex-col overflow-hidden bg-background">
      <ScrollArea className="flex-1 p-4 pr-4"> {/* Ajuste de padding */}
        <div className="space-y-4 pb-4">
          
          {mensagensVisiveis.map((msg: ChatMessage, index: number) => (
            <div
              key={index}
              className={cn(
                "flex w-full items-start gap-2",
                msg.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {msg.role === "assistant" && (
                <Avatar className="h-8 w-8 bg-primary text-primary-foreground flex-shrink-0 mt-1">
                  <AvatarFallback><Bot className="h-5 w-5" /></AvatarFallback>
                </Avatar>
              )}
              
              <div
                className={cn(
                  "rounded-2xl px-4 py-3 shadow-sm text-sm",
                  "max-w-[85%]", // Limite de largura
                  "whitespace-pre-wrap", // Mantém quebras de linha mas permite wrapping
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-none"
                    : "bg-muted text-muted-foreground rounded-bl-none border border-border"
                )}
              >
                {/* Renderiza HTML com segurança */}
                <div 
                  dangerouslySetInnerHTML={{ __html: msg.content.replace(/\n/g, '<br />') }} 
                  className="leading-relaxed w-full break-all" // <-- AJUSTE CRÍTICO APLICADO AQUI
                />
              </div>

              {msg.role === "user" && (
                <Avatar className="h-8 w-8 bg-muted text-muted-foreground flex-shrink-0 mt-1">
                  <AvatarFallback><User className="h-5 w-5" /></AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}

          {isBotTyping && ( 
            <div className="flex items-start gap-2 justify-start animate-in fade-in duration-300">
              <Avatar className="h-8 w-8 bg-primary text-primary-foreground flex-shrink-0 mt-1">
                <AvatarFallback><Bot className="h-5 w-5" /></AvatarFallback>
              </Avatar>
              <div className="rounded-2xl rounded-bl-none px-4 py-3 bg-muted text-muted-foreground border border-border">
                <div className="flex space-x-1 h-5 items-center">
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="p-3 border-t bg-background">
        <form onSubmit={handleSubmit} className="flex items-center gap-2 relative">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Digite sua dúvida..."
            className="flex-1 pr-10 py-5 rounded-full"
            disabled={isLoading || isBotTyping}
            autoFocus
          />
          <Button 
            type="submit" 
            size="icon" 
            disabled={isLoading || isBotTyping}
            className="absolute right-1 top-1 h-8 w-8 rounded-full"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AiChatWidget;