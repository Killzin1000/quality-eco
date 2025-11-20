import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom"; // Importa hooks de navegação
import { toast } from "sonner";

const API_URL = "http://127.0.0.1:8000/chat";

// 1. Define as estruturas (espelhando o Python)
interface ChatMessage {
  role: "user" | "assistant"; // Deve ser 'assistant'
  content: string;
}

interface ChatSession {
  nome_cliente: string;
  formacao_cliente: string | null;
  tipo_formacao: string | null;
  area_preferencial: string | null;
  historico: ChatMessage[];
  curso_contexto: string | null;
}

// 2. Define o que o Contexto vai fornecer
interface ChatContextType {
  session: ChatSession;
  isOpen: boolean;
  isLoading: boolean;
  isBotTyping: boolean;
  
  openChat: () => void;
  closeChat: () => void;
  toggleChat: () => void;
  
  handleSend: (input: string) => Promise<void>;
  
  // Função para definir o contexto do curso
  setCourseContext: (courseName: string | null) => void;
}

// 3. Cria o Contexto
const ChatContext = createContext<ChatContextType | undefined>(undefined);

// 4. Cria o Provedor
export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<ChatSession>({
    nome_cliente: "visitante",
    formacao_cliente: null,
    tipo_formacao: null,
    area_preferencial: null,
    historico: [],
    curso_contexto: null,
  });
  
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isBotTyping, setIsBotTyping] = useState(false);
  
  const navigate = useNavigate(); // Hook de navegação
  const location = useLocation(); // Hook para saber a página atual

  // Efeito que monitora a mudança de página
  useEffect(() => {
    // Se o usuário navegar, mas o chat estiver fechado, não faz nada
    if (!isOpen) return;

    // Se o usuário navegou, fechamos o chat para não atrapalhar
    console.log("LOG (ChatProvider): Navegação detectada. Fechando o chat.");
    setIsOpen(false);
  }, [location.pathname]); // Dispara a cada mudança de URL

  // Função para enviar saudação inicial
  const getInitialGreeting = async (currentContext: string | null) => {
    console.log(`LOG (ChatProvider): Iniciando chat com contexto: ${currentContext || 'Nenhum'}`);
    setIsBotTyping(true);
    
    // Reseta o histórico, mas mantém o contexto do curso
    const initialSession: ChatSession = {
      ...session, // Pega nome_cliente, etc. que já podem existir
      historico: [],
      curso_contexto: currentContext,
    };
    
    try {
      const payload = {
        mensagem: "...iniciar...",
        session: initialSession
      };

      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Erro ao conectar com o assistente.");

      const data = await response.json();
      setSession(data.session_atualizada);
      console.log("LOG (ChatProvider): Saudação recebida da API.");

    } catch (error: any) {
      console.error("Erro na saudação inicial:", error);
      toast.error("Erro ao conectar com o Assistente de IA.");
      setSession(prev => ({
        ...prev,
        historico: [{ role: "assistant", content: "Desculpe, estou com problemas para conectar. Tente recarregar a página." }]
      }));
    } finally {
      setIsBotTyping(false);
    }
  };

  // Função para enviar mensagem (agora vive no Contexto)
  const handleSend = async (input: string) => {
    if (!input.trim() || isLoading) return;

    console.log(`LOG (ChatProvider): Usuário enviou: "${input}"`);

    const userMessage: ChatMessage = { role: "user", content: input };

    const sessionParaEnviar = {
      ...session,
      historico: [...session.historico, userMessage],
    };
    setSession(sessionParaEnviar); // Atualiza o UI imediatamente
    
    setIsLoading(true);
    setIsBotTyping(true);

    try {
      const payload = {
        mensagem: input,
        session: sessionParaEnviar
      };

      console.log("LOG (ChatProvider): Enviando para API Python:", payload);
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Erro ao processar sua mensagem.");
      
      const data = await response.json();
      
      // Atualiza a sessão com a resposta do bot
      setSession(data.session_atualizada);
      console.log("LOG (ChatProvider): Resposta recebida da API.");

      // ***** A MÁGICA DA NAVEGAÇÃO ACONTECE AQUI *****
      if (data.navegar_para) {
        console.log(`LOG (ChatProvider): API solicitou navegação para: ${data.navegar_para}`);
        toast.info("OK! Estou te levando para a página do curso...");
        setIsOpen(false); // Fecha o chat
        navigate(data.navegar_para); // Navega
      }
      // ************************************************

    } catch (error: any) {
      console.error("Erro ao enviar mensagem:", error);
      toast.error("Erro ao enviar mensagem.");
      const errorMessage: ChatMessage = { role: "assistant", content: "Desculpe, não consegui processar sua mensagem. Tente novamente." };
      setSession(prev => ({
          ...prev,
          historico: [...prev.historico, errorMessage]
      }));
    } finally {
      setIsLoading(false);
      setIsBotTyping(false);
    }
  };
  
  // Funções de controle do Popover/Drawer
  const openChat = () => {
    // Ao abrir, se o histórico estiver vazio, busca a saudação
    // O 'curso_contexto' já deve ter sido setado pelo 'setCourseContext'
    if (session.historico.length === 0) {
      getInitialGreeting(session.curso_contexto);
    }
    setIsOpen(true);
  };
  const closeChat = () => setIsOpen(false);
  const toggleChat = () => {
    if (isOpen) {
      closeChat();
    } else {
      openChat();
    }
  };
  
  // Função para as páginas (ex: CourseDetail) informarem o contexto
  const setCourseContext = (courseName: string | null) => {
    // Só atualiza se o contexto mudou E o chat estiver fechado
    // (para não resetar uma conversa no meio)
    if (courseName !== session.curso_contexto && !isOpen) {
      console.log(`LOG (ChatProvider): Contexto do curso definido para: ${courseName}`);
      setSession(prev => ({ ...prev, curso_contexto: courseName }));
    }
  };

  return (
    <ChatContext.Provider value={{ 
      session, 
      isOpen, 
      isLoading, 
      isBotTyping, 
      openChat, 
      closeChat, 
      toggleChat, 
      handleSend,
      setCourseContext
    }}>
      {children}
    </ChatContext.Provider>
  );
};

// 5. Hook customizado para consumir o chat
export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat deve ser usado dentro de um ChatProvider");
  }
  return context;
};