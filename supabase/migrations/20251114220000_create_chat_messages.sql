-- Criar tabela de mensagens do chat
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  role TEXT NOT NULL, -- 'user', 'assistant', 'system'
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar índices para busca rápida por sessão e data
CREATE INDEX idx_chat_messages_session ON public.chat_messages(session_id);
CREATE INDEX idx_chat_messages_created_at ON public.chat_messages(created_at DESC);

-- Habilitar RLS
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Políticas de Segurança
-- 1. Permitir inserção pública (para a API Python poder salvar as mensagens do usuário/bot)
CREATE POLICY "Permitir inserção de mensagens"
  ON public.chat_messages
  FOR INSERT
  WITH CHECK (true);

-- 2. Permitir leitura apenas para Admins (para o Painel Admin)
-- Nota: Se precisar que o usuário leia seu próprio histórico via Supabase no futuro, ajuste aqui.
CREATE POLICY "Admins podem ler todas mensagens"
  ON public.chat_messages
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));