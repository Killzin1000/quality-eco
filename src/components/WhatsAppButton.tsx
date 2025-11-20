import { Bot, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import AiChatWidget from "./AiChatWidget";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useChat } from "@/ChatProvider"; // <-- CORRIGIDO AQUI (removido o /context)
import { useEffect } from "react";

interface WhatsAppButtonProps {
  courseContext?: {
    id: number;
    nome: string | null;
  };
}

export const WhatsAppButton = ({ courseContext }: WhatsAppButtonProps) => {
  const { isOpen, toggleChat, setCourseContext } = useChat();
  const isMobile = useIsMobile();
  
  useEffect(() => {
    setCourseContext(courseContext?.nome || null);
  }, [courseContext, setCourseContext]);

  console.log("LOG (FloatingButton): Estado do Chat:", isOpen ? "Aberto" : "Fechado");
  console.log("LOG (FloatingButton): Modo mobile:", isMobile);

  const ChatTriggerButton = (
    <Button
      size="icon"
      className={cn(
        "fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 transition-colors duration-300",
        isOpen 
          ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
          : "bg-primary text-primary-foreground hover:bg-primary/90 animate-pulse"
      )}
      onClick={toggleChat}
    >
      {isOpen ? <X className="h-7 w-7" /> : <Bot className="h-7 w-7" />}
    </Button>
  );

  const ChatContent = (
    <div className="h-full w-full flex flex-col">
      {isMobile && (
        <DrawerHeader className="text-left">
          <DrawerTitle>Assistente Virtual ESP</DrawerTitle>
        </DrawerHeader>
      )}
      <AiChatWidget /> 
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={toggleChat}>
        <DrawerTrigger asChild>
          {ChatTriggerButton}
        </DrawerTrigger>
        <DrawerContent className="h-[85vh] max-h-[700px] z-40">
          {ChatContent}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={toggleChat}>
      <PopoverTrigger asChild>
        {ChatTriggerButton}
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="end"
        className={cn(
          "w-[400px] h-[600px] z-40 p-0 mr-4 mb-2 overflow-hidden",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          "data-[side=top]:slide-in-from-bottom-2 data-[side=bottom]:slide-in-from-top-2"
        )}
      >
        {ChatContent}
      </PopoverContent>
    </Popover>
  );
};