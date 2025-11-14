-- Criar tabela de cupons
CREATE TABLE IF NOT EXISTS public.cupons (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo text NOT NULL UNIQUE,
  desconto_percentual integer NOT NULL CHECK (desconto_percentual > 0 AND desconto_percentual <= 100),
  tipo text NOT NULL DEFAULT 'geral', -- 'geral', 'exit_intent', 'promocional'
  ativo boolean NOT NULL DEFAULT true,
  data_expiracao timestamp with time zone,
  uso_maximo integer DEFAULT 1, -- quantas vezes pode ser usado
  uso_atual integer DEFAULT 0, -- quantas vezes foi usado
  created_at timestamp with time zone DEFAULT now()
);

-- Criar índice para busca rápida por código
CREATE INDEX idx_cupons_codigo ON public.cupons(codigo) WHERE ativo = true;

-- Criar tabela de leads capturados via exit-intent
CREATE TABLE IF NOT EXISTS public.leads_exit_intent (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nome text NOT NULL,
  telefone text NOT NULL,
  cupom_codigo text,
  cupom_usado boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- Criar índice para busca de leads
CREATE INDEX idx_leads_telefone ON public.leads_exit_intent(telefone);

-- Habilitar RLS
ALTER TABLE public.cupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads_exit_intent ENABLE ROW LEVEL SECURITY;

-- Políticas para cupons (leitura pública para validação)
CREATE POLICY "Permitir leitura pública de cupons ativos"
  ON public.cupons
  FOR SELECT
  USING (ativo = true);

CREATE POLICY "Permitir inserção de cupons"
  ON public.cupons
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Permitir atualização de cupons"
  ON public.cupons
  FOR UPDATE
  USING (true);

-- Políticas para leads
CREATE POLICY "Permitir inserção de leads"
  ON public.leads_exit_intent
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Permitir leitura de leads"
  ON public.leads_exit_intent
  FOR SELECT
  USING (true);

-- Inserir cupom padrão de 50% para exit-intent (será usado como template)
INSERT INTO public.cupons (codigo, desconto_percentual, tipo, ativo, uso_maximo)
VALUES ('BEMVINDO50', 50, 'exit_intent', true, 999999)
ON CONFLICT (codigo) DO NOTHING;