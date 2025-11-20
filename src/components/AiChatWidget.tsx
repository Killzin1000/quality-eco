import { useEffect, useRef, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Send, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useChat } from "@/ChatProvider";

// Interface (local)
interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export const AiChatWidget = () => {
  // Puxa tudo do Contexto
  const { 
    session, 
    handleSend, 
    isLoading, 
    isBotTyping 
  } = useChat();

  const [input, setInput] = useState("");
  
  // Ref para o "final" da lista (elemento invisível)
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Função para rolar até o final
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Rola sempre que o histórico ou o estado de digitação mudar
  useEffect(() => {
    scrollToBottom();
  }, [session.historico, isBotTyping]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    console.log("LOG (ChatWidget): Enviando pro Contexto:", input);
    handleSend(input);
    setInput("");
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-background">
      {/* Lista de Mensagens */}
      <ScrollArea className="flex-1 p-4 pr-5"> {/* pr-5 dá espaço para a barra de rolagem não cobrir texto */}
        <div className="space-y-6 pb-4"> {/* pb-4 dá um respiro no final */}
          
          {session.historico.map((msg: ChatMessage, index: number) => (
            <div
              key={index}
              className={cn(
                "flex w-full items-start gap-2", // w-full garante uso do espaço
                msg.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {msg.role === "assistant" && (
                <Avatar className="h-8 w-8 bg-primary text-primary-foreground flex-shrink-0 mt-1">
                  <AvatarFallback>
                    <Bot className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
              )}
              
              <div
                className={cn(
                  "rounded-2xl px-4 py-3 max-w-[85%] shadow-sm text-sm", // Aumentei para 85%
                  "break-words whitespace-pre-wrap", // <--- CORREÇÃO: Quebra palavras longas e respeita quebras de linha
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-none" // Balão do User
                    : "bg-muted text-muted-foreground rounded-bl-none border border-border" // Balão do Bot
                )}
              >
                {/* Renderiza HTML com segurança e estilo */}
                <div 
                  dangerouslySetInnerHTML={{ __html: msg.content.replace(/\n/g, '<br />') }} 
                  className="leading-relaxed" // Melhora leitura
                />
              </div>

              {msg.role === "user" && (
                <Avatar className="h-8 w-8 bg-muted text-muted-foreground flex-shrink-0 mt-1">
                  <AvatarFallback>
                    <User className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}

          {/* Indicador de Digitação */}
          {isBotTyping && ( 
            <div className="flex items-start gap-2 justify-start animate-in fade-in duration-300">
              <Avatar className="h-8 w-8 bg-primary text-primary-foreground flex-shrink-0 mt-1">
                <AvatarFallback>
                  <Bot className="h-5 w-5" />
                </AvatarFallback>
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
          
          {/* Elemento invisível para ancorar o scroll no final */}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Área de Input (fixa no fundo) */}
      <div className="p-4 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2 relative"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Digite sua dúvida..."
            className="flex-1 pr-12 py-6 rounded-full shadow-sm" // Mais gordinho e arredondado
            disabled={isLoading || isBotTyping}
            autoFocus
          />
          <Button 
            type="submit" 
            size="icon" 
            disabled={isLoading || isBotTyping}
            className="absolute right-1.5 top-1.5 h-9 w-9 rounded-full" // Botão dentro do input
          >
            <Send className="h-4 w-4" />
            <span className="sr-only">Enviar</span>
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AiChatWidget;