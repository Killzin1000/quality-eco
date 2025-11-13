-- Adicionar campo ImagemCapa à tabela cursos
ALTER TABLE cursos ADD COLUMN IF NOT EXISTS "ImagemCapa" TEXT;

-- Criar tabela de carrinhos abandonados
CREATE TABLE IF NOT EXISTS public.carrinhos_abandonados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT,
  telefone TEXT,
  curso_id BIGINT REFERENCES public.cursos(id),
  data_abandono TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de matrículas
CREATE TABLE IF NOT EXISTS public.matriculas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  curso_id BIGINT REFERENCES public.cursos(id),
  aluno_nome TEXT NOT NULL,
  aluno_email TEXT NOT NULL,
  aluno_telefone TEXT,
  aluno_cpf TEXT,
  forma_pagamento TEXT NOT NULL,
  valor_pago TEXT NOT NULL,
  data_compra TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de avaliações
CREATE TABLE IF NOT EXISTS public.avaliacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  curso_id BIGINT REFERENCES public.cursos(id),
  nome TEXT NOT NULL,
  nota INTEGER NOT NULL CHECK (nota >= 1 AND nota <= 5),
  comentario TEXT,
  data TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS nas novas tabelas
ALTER TABLE public.carrinhos_abandonados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matriculas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avaliacoes ENABLE ROW LEVEL SECURITY;

-- Políticas para carrinhos_abandonados (apenas admin pode ver)
CREATE POLICY "Permitir leitura de carrinhos abandonados"
  ON public.carrinhos_abandonados
  FOR SELECT
  USING (true);

CREATE POLICY "Permitir inserção de carrinhos abandonados"
  ON public.carrinhos_abandonados
  FOR INSERT
  WITH CHECK (true);

-- Políticas para matrículas (público pode inserir, apenas admin pode ver todas)
CREATE POLICY "Permitir leitura de matrículas"
  ON public.matriculas
  FOR SELECT
  USING (true);

CREATE POLICY "Permitir inserção de matrículas"
  ON public.matriculas
  FOR INSERT
  WITH CHECK (true);

-- Políticas para avaliações (todos podem ler, qualquer um pode inserir)
CREATE POLICY "Permitir leitura de avaliações"
  ON public.avaliacoes
  FOR SELECT
  USING (true);

CREATE POLICY "Permitir inserção de avaliações"
  ON public.avaliacoes
  FOR INSERT
  WITH CHECK (true);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_carrinhos_email ON public.carrinhos_abandonados(email);
CREATE INDEX IF NOT EXISTS idx_matriculas_curso ON public.matriculas(curso_id);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_curso ON public.avaliacoes(curso_id);
CREATE INDEX IF NOT EXISTS idx_cursos_modalidade ON public.cursos("Modalidade");
CREATE INDEX IF NOT EXISTS idx_cursos_tipo ON public.cursos("Tipo");