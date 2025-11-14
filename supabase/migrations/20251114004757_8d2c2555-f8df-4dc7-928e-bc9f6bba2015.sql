-- Criar enum para roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Criar tabela de roles de usuários
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Criar tabela de visualizações de cursos
CREATE TABLE IF NOT EXISTS public.curso_visualizacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  curso_id bigint NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  duracao_segundos integer DEFAULT 0,
  origem text, -- 'home', 'listagem', 'busca', 'direto'
  dispositivo text, -- 'mobile', 'tablet', 'desktop'
  created_at timestamp with time zone DEFAULT now()
);

-- Criar tabela de sessões de usuário
CREATE TABLE IF NOT EXISTS public.sessoes_usuario (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text UNIQUE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  pagina_inicial text,
  pagina_final text,
  tempo_total_segundos integer DEFAULT 0,
  paginas_visitadas integer DEFAULT 0,
  converteu boolean DEFAULT false, -- se fez matrícula
  dispositivo text,
  navegador text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Criar tabela de eventos de interação
CREATE TABLE IF NOT EXISTS public.eventos_interacao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  tipo_evento text NOT NULL, -- 'click', 'scroll', 'form_submit', 'search', etc
  elemento text, -- identificador do elemento
  pagina text NOT NULL,
  dados_extras jsonb, -- informações adicionais sobre o evento
  created_at timestamp with time zone DEFAULT now()
);

-- Criar índices para performance
CREATE INDEX idx_visualizacoes_curso ON public.curso_visualizacoes(curso_id);
CREATE INDEX idx_visualizacoes_session ON public.curso_visualizacoes(session_id);
CREATE INDEX idx_visualizacoes_data ON public.curso_visualizacoes(created_at DESC);
CREATE INDEX idx_sessoes_session ON public.sessoes_usuario(session_id);
CREATE INDEX idx_sessoes_data ON public.sessoes_usuario(created_at DESC);
CREATE INDEX idx_eventos_session ON public.eventos_interacao(session_id);
CREATE INDEX idx_eventos_tipo ON public.eventos_interacao(tipo_evento);
CREATE INDEX idx_eventos_data ON public.eventos_interacao(created_at DESC);

-- Habilitar RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curso_visualizacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessoes_usuario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eventos_interacao ENABLE ROW LEVEL SECURITY;

-- Criar função para verificar role (security definer para evitar recursão)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Políticas para user_roles
CREATE POLICY "Usuários podem ver seus próprios roles"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins podem gerenciar roles"
  ON public.user_roles
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Políticas para visualizações (públicas para inserção de analytics)
CREATE POLICY "Permitir inserção de visualizações"
  ON public.curso_visualizacoes
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins podem ler visualizações"
  ON public.curso_visualizacoes
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Políticas para sessões
CREATE POLICY "Permitir inserção e atualização de sessões"
  ON public.sessoes_usuario
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins podem ler sessões"
  ON public.sessoes_usuario
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Políticas para eventos
CREATE POLICY "Permitir inserção de eventos"
  ON public.eventos_interacao
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins podem ler eventos"
  ON public.eventos_interacao
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Criar view para estatísticas de cursos
CREATE OR REPLACE VIEW public.estatisticas_cursos AS
SELECT 
  c.id,
  c."Nome dos cursos" as nome,
  COUNT(DISTINCT cv.id) as total_visualizacoes,
  COUNT(DISTINCT cv.session_id) as visitantes_unicos,
  COALESCE(AVG(cv.duracao_segundos), 0)::integer as tempo_medio_segundos,
  COUNT(DISTINCT m.id) as total_matriculas,
  ROUND(
    (COUNT(DISTINCT m.id)::numeric / NULLIF(COUNT(DISTINCT cv.session_id), 0)) * 100, 
    2
  ) as taxa_conversao
FROM public.cursos c
LEFT JOIN public.curso_visualizacoes cv ON c.id = cv.curso_id
LEFT JOIN public.matriculas m ON c.id = m.curso_id
GROUP BY c.id, c."Nome dos cursos";

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para sessões
CREATE TRIGGER update_sessoes_updated_at
  BEFORE UPDATE ON public.sessoes_usuario
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();