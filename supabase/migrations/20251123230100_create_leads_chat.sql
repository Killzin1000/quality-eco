-- migration file name example: 20251123230100_create_leads_chat.sql

-- Tabela para leads capturados durante a conversa com o assistente IA
CREATE TABLE IF NOT EXISTS public.leads_chat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL UNIQUE, -- Identificador único da sessão (nome do cliente/ID da sessão)
  nome TEXT,
  telefone TEXT,
  formacao TEXT, -- Formação superior do cliente
  area_preferencial TEXT, -- Área de interesse (Saúde, Educação, etc.)
  curso_contexto TEXT, -- Nome do último curso em foco
  status TEXT DEFAULT 'parcial' NOT NULL, -- 'parcial', 'completo', 'convertido'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índice para busca rápida por session_id
CREATE UNIQUE INDEX idx_leads_chat_session_id ON public.leads_chat(session_id);

-- Adicionar Trigger para atualizar updated_at
CREATE TRIGGER update_leads_chat_updated_at
  BEFORE UPDATE ON public.leads_chat
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();


-- Habilitar RLS
ALTER TABLE public.leads_chat ENABLE ROW LEVEL SECURITY;

-- Políticas de Segurança
-- 1. Permitir apenas ADMINS para leitura/escrita
-- Usaremos a função de role já definida (assumindo que o usuário logado é admin)
CREATE POLICY "Admins podem gerenciar leads_chat"
  ON public.leads_chat
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- 2. Permitir inserção/atualização por serviço (via API Python)
-- A API Python usará a Service Key para operações de escrita.
-- Este policy é necessário para que a API consiga fazer o UPSERT
CREATE POLICY "Permitir upsert via API Python"
  ON public.leads_chat
  FOR ALL
  USING (true);