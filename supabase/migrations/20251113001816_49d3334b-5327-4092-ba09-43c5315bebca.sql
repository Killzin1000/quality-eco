-- Habilitar RLS na tabela cursos
ALTER TABLE public.cursos ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura pública de cursos (necessário para e-commerce)
CREATE POLICY "Permitir leitura pública de cursos"
  ON public.cursos
  FOR SELECT
  USING (true);

-- Política para permitir inserção de cursos (admin pode adicionar via painel)
CREATE POLICY "Permitir inserção de cursos"
  ON public.cursos
  FOR INSERT
  WITH CHECK (true);

-- Política para permitir atualização de cursos (admin pode editar via painel)
CREATE POLICY "Permitir atualização de cursos"
  ON public.cursos
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Política para permitir exclusão de cursos (admin pode remover via painel)
CREATE POLICY "Permitir exclusão de cursos"
  ON public.cursos
  FOR DELETE
  USING (true);