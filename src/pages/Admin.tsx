import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Plus, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/admin/ProtectedRoute";
import { DashboardStats } from "@/components/admin/DashboardStats";
import { TopCourses } from "@/components/admin/TopCourses";
import { AbandonedCarts } from "@/components/admin/AbandonedCarts";
import { LeadsExitIntent } from "@/components/admin/LeadsExitIntent";

const Admin = () => {
  const [cursos, setCursos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para analytics
  const [stats, setStats] = useState({
    totalVisualizacoes: 0,
    visitantesUnicos: 0,
    totalMatriculas: 0,
    taxaConversao: 0,
    tempoMedioSessao: 0,
    carrinhoAbandonado: 0,
  });
  const [topCursos, setTopCursos] = useState<any[]>([]);
  const [carrinhosAbandonados, setCarrinhosAbandonados] = useState<any[]>([]);
  const [leadsExitIntent, setLeadsExitIntent] = useState<any[]>([]);

  useEffect(() => {
    fetchCursos();
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      // Buscar estatísticas gerais
      const { data: visualizacoes } = await supabase
        .from("curso_visualizacoes")
        .select("id, session_id");

      const { data: matriculas } = await supabase
        .from("matriculas")
        .select("id");

      const { data: sessoes } = await supabase
        .from("sessoes_usuario")
        .select("tempo_total_segundos");

      const { data: carrinhos } = await supabase
        .from("carrinhos_abandonados")
        .select("*");

      const totalVis = visualizacoes?.length || 0;
      const visitantesUnicos = new Set(visualizacoes?.map((v) => v.session_id)).size;
      const totalMat = matriculas?.length || 0;
      const tempoMedio = sessoes?.length 
        ? Math.floor(sessoes.reduce((acc, s) => acc + s.tempo_total_segundos, 0) / sessoes.length)
        : 0;

      setStats({
        totalVisualizacoes: totalVis,
        visitantesUnicos,
        totalMatriculas: totalMat,
        taxaConversao: visitantesUnicos > 0 ? (totalMat / visitantesUnicos) * 100 : 0,
        tempoMedioSessao: tempoMedio,
        carrinhoAbandonado: carrinhos?.length || 0,
      });

      // Buscar top cursos - usar consulta manual devido à view
      const { data: cursosList } = await supabase.from("cursos").select("id, \"Nome dos cursos\"");
      const { data: todasVisualizacoes } = await supabase.from("curso_visualizacoes").select("*");
      const { data: todasMatriculas } = await supabase.from("matriculas").select("*");

      const estatisticas = cursosList?.map((curso) => {
        const cursosVis = todasVisualizacoes?.filter((v) => v.curso_id === curso.id) || [];
        const cursosMat = todasMatriculas?.filter((m) => m.curso_id === curso.id) || [];
        const visitantesUnicosCurso = new Set(cursosVis.map((v) => v.session_id)).size;
        const tempoMedioCurso = cursosVis.length > 0
          ? Math.floor(cursosVis.reduce((acc, v) => acc + (v.duracao_segundos || 0), 0) / cursosVis.length)
          : 0;

        return {
          id: curso.id,
          nome: curso["Nome dos cursos"] || "Sem nome",
          total_visualizacoes: cursosVis.length,
          visitantes_unicos: visitantesUnicosCurso,
          tempo_medio_segundos: tempoMedioCurso,
          total_matriculas: cursosMat.length,
          taxa_conversao: visitantesUnicosCurso > 0 ? (cursosMat.length / visitantesUnicosCurso) * 100 : 0,
        };
      }) || [];

      const estatisticasOrdenadas = estatisticas
        .sort((a, b) => b.total_visualizacoes - a.total_visualizacoes)
        .slice(0, 10);

      setTopCursos(estatisticasOrdenadas);

      // Buscar carrinhos abandonados com nome do curso
      const { data: carrinhosData } = await supabase
        .from("carrinhos_abandonados")
        .select("*")
        .order("data_abandono", { ascending: false })
        .limit(10);

      const carrinhosComCursos = await Promise.all(
        (carrinhosData || []).map(async (carrinho) => {
          const { data: curso } = await supabase
            .from("cursos")
            .select("\"Nome dos cursos\"")
            .eq("id", carrinho.curso_id)
            .single();
          
          return {
            ...carrinho,
            curso_nome: curso?.["Nome dos cursos"] || null,
          };
        })
      );

      setCarrinhosAbandonados(carrinhosComCursos);

      // Buscar leads exit-intent
      const { data: leads } = await supabase
        .from("leads_exit_intent")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      setLeadsExitIntent(leads || []);
    } catch (error) {
      console.error("Erro ao buscar analytics:", error);
    }
  };

  const fetchCursos = async () => {
    try {
      const { data, error } = await supabase
        .from("cursos")
        .select("*")
        .order("id", { ascending: false });

      if (error) throw error;
      setCursos(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar cursos");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col">
        <Navbar />

        <main className="container mx-auto px-4 py-8 flex-1">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold mb-2">Painel Administrativo</h1>
                <p className="text-muted-foreground">
                  Gerencie cursos e acompanhe métricas de engajamento
                </p>
              </div>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Novo Curso
              </Button>
            </div>

            <Tabs defaultValue="analytics" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2 lg:w-auto">
                <TabsTrigger value="analytics" className="gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Analytics
                </TabsTrigger>
                <TabsTrigger value="cursos">Cursos</TabsTrigger>
              </TabsList>

              <TabsContent value="analytics" className="space-y-6">
                <DashboardStats {...stats} />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <TopCourses cursos={topCursos} />
                  <AbandonedCarts carrinhos={carrinhosAbandonados} />
                </div>

                <LeadsExitIntent leads={leadsExitIntent} />
              </TabsContent>

              <TabsContent value="cursos">
                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-pulse text-lg">Carregando cursos...</div>
                  </div>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle>Cursos Cadastrados</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Nome</TableHead>
                            <TableHead>Modalidade</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {cursos.map((curso) => (
                            <TableRow key={curso.id}>
                              <TableCell>{curso.id}</TableCell>
                              <TableCell className="font-medium">
                                {curso["Nome dos cursos"]}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    curso.Modalidade === "EaD" ? "default" : "secondary"
                                  }
                                >
                                  {curso.Modalidade}
                                </Badge>
                              </TableCell>
                              <TableCell>{curso.Tipo}</TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <Button size="sm" variant="outline">
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button size="sm" variant="outline">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </main>

        <Footer />
      </div>
    </ProtectedRoute>
  );
};

export default Admin;
