import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

// Gerar ID de sessão único
const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem("analytics_session_id");
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem("analytics_session_id", sessionId);
  }
  return sessionId;
};

// Detectar tipo de dispositivo
const getDeviceType = (): string => {
  const width = window.innerWidth;
  if (width < 768) return "mobile";
  if (width < 1024) return "tablet";
  return "desktop";
};

// Detectar navegador
const getBrowser = (): string => {
  const ua = navigator.userAgent;
  if (ua.includes("Chrome")) return "Chrome";
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Safari")) return "Safari";
  if (ua.includes("Edge")) return "Edge";
  return "Outro";
};

export const useAnalytics = () => {
  const sessionId = useRef(getSessionId());

  useEffect(() => {
    // Inicializar sessão
    const initSession = async () => {
      try {
        const { data: existingSession } = await supabase
          .from("sessoes_usuario")
          .select("*")
          .eq("session_id", sessionId.current)
          .single();

        if (!existingSession) {
          await supabase.from("sessoes_usuario").insert({
            session_id: sessionId.current,
            pagina_inicial: window.location.pathname,
            dispositivo: getDeviceType(),
            navegador: getBrowser(),
            paginas_visitadas: 1,
          });
        }
      } catch (error) {
        console.error("Erro ao inicializar sessão:", error);
      }
    };

    initSession();

    // Atualizar sessão ao sair
    const handleBeforeUnload = async () => {
      try {
        await supabase
          .from("sessoes_usuario")
          .update({
            pagina_final: window.location.pathname,
          })
          .eq("session_id", sessionId.current);
      } catch (error) {
        console.error("Erro ao finalizar sessão:", error);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  // Rastrear visualização de curso
  const trackCourseView = async (
    cursoId: number,
    origem: string = "direto"
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      await supabase.from("curso_visualizacoes").insert({
        curso_id: cursoId,
        user_id: user?.id || null,
        session_id: sessionId.current,
        origem,
        dispositivo: getDeviceType(),
      });

      // Atualizar contador de páginas visitadas
      const { data: sessao } = await supabase
        .from("sessoes_usuario")
        .select("paginas_visitadas")
        .eq("session_id", sessionId.current)
        .single();

      if (sessao) {
        await supabase
          .from("sessoes_usuario")
          .update({ paginas_visitadas: (sessao.paginas_visitadas || 0) + 1 })
          .eq("session_id", sessionId.current);
      }
    } catch (error) {
      console.error("Erro ao rastrear visualização:", error);
    }
  };

  // Atualizar duração da visualização
  const updateViewDuration = async (cursoId: number, seconds: number) => {
    try {
      // Encontrar a visualização mais recente deste curso nesta sessão
      const { data: views } = await supabase
        .from("curso_visualizacoes")
        .select("id")
        .eq("curso_id", cursoId)
        .eq("session_id", sessionId.current)
        .order("created_at", { ascending: false })
        .limit(1);

      if (views && views.length > 0) {
        await supabase
          .from("curso_visualizacoes")
          .update({ duracao_segundos: seconds })
          .eq("id", views[0].id);
      }

      // Atualizar tempo total da sessão
      const { data: sessao } = await supabase
        .from("sessoes_usuario")
        .select("tempo_total_segundos")
        .eq("session_id", sessionId.current)
        .single();

      if (sessao) {
        await supabase
          .from("sessoes_usuario")
          .update({ tempo_total_segundos: (sessao.tempo_total_segundos || 0) + seconds })
          .eq("session_id", sessionId.current);
      }
    } catch (error) {
      console.error("Erro ao atualizar duração:", error);
    }
  };

  // Rastrear evento
  const trackEvent = async (
    tipoEvento: string,
    elemento?: string,
    dadosExtras?: any
  ) => {
    try {
      await supabase.from("eventos_interacao").insert({
        session_id: sessionId.current,
        tipo_evento: tipoEvento,
        elemento,
        pagina: window.location.pathname,
        dados_extras: dadosExtras || null,
      });
    } catch (error) {
      console.error("Erro ao rastrear evento:", error);
    }
  };

  // Marcar conversão
  const markConversion = async () => {
    try {
      await supabase
        .from("sessoes_usuario")
        .update({ converteu: true })
        .eq("session_id", sessionId.current);
    } catch (error) {
      console.error("Erro ao marcar conversão:", error);
    }
  };

  return {
    trackCourseView,
    updateViewDuration,
    trackEvent,
    markConversion,
    sessionId: sessionId.current,
  };
};
