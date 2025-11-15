import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Plus, BarChart3, Calendar as CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/admin/ProtectedRoute";
import { DashboardStats } from "@/components/admin/DashboardStats";
import { TopCourses } from "@/components/admin/TopCourses";
import { AbandonedCarts } from "@/components/admin/AbandonedCarts";
import { LeadsExitIntent } from "@/components/admin/LeadsExitIntent";
import { DateRange } from "react-day-picker";
import { format, subDays, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

const Admin = () => {
  const [cursos, setCursos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State para o seletor de data
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 29), // Padrão: últimos 30 dias
    to: new Date(),
  });
  
  // State que de fato aciona o filtro
  const [filterDateRange, setFilterDateRange] = useState<DateRange | undefined>(
    dateRange
  );

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

  // Atualiza os dados quando o 'filterDateRange' for alterado
  useEffect(() => {
    console.log("LOG: Mudança no filterDateRange detectada. Buscando dados...");
    fetchCursos();
    fetchAnalytics();
  }, [filterDateRange]);

  const handleFilterApply = () => {
    console.log("LOG: Botão 'Aplicar' clicado. Atualizando filterDateRange.");
    setFilterDateRange(dateRange);
  };

  const fetchAnalytics = async () => {
    console.log("LOG: fetchAnalytics iniciado...");
    setLoading(true);

    if (!filterDateRange?.from) {
      console.warn("LOG: fetchAnalytics abortado - data 'from' não definida.");
      setLoading(false);
      return;
    }

    // Definir datas de início e fim (garantindo que o 'to' vá até o fim do dia)
    const fromDate = filterDateRange.from;
    const toDate = filterDateRange.to ? endOfDay(filterDateRange.to) : endOfDay(new Date());

    console.log(`LOG: Buscando dados de ${fromDate.toISOString()} até ${toDate.toISOString()}`);

    try {
      // Buscar estatísticas gerais
      const { data: visualizacoes } = await supabase
        .from("curso_visualizacoes")
        .select("id, session_id")
        .gte('created_at', fromDate.toISOString())
        .lte('created_at', toDate.toISOString());
      console.log(`LOG: Visualizações encontradas: ${visualizacoes?.length ?? 0}`);

      const { data: matriculas } = await supabase
        .from("matriculas")
        .select("id")
        .gte('created_at', fromDate.toISOString())
        .lte('created_at', toDate.toISOString());
      console.log(`LOG: Matrículas encontradas: ${matriculas?.length ?? 0}`);

      const { data: sessoes } = await supabase
        .from("sessoes_usuario")
        .select("tempo_total_segundos")
        .gte('created_at', fromDate.toISOString())
        .lte('created_at', toDate.toISOString());

      const { data: carrinhos } = await supabase
        .from("carrinhos_abandonados")
        .select("*")
        .gte('data_abandono', fromDate.toISOString())
        .lte('data_abandono', toDate.toISOString());
      console.log(`LOG: Carrinhos abandonados: ${carrinhos?.length ?? 0}`);

      const totalVis = visualizacoes?.length || 0;
      const visitantesUnicos = new Set(visualizacoes?.map((v) => v.session_id)).size;
      const totalMat = matriculas?.length || 0;
      const tempoMedio = sessoes?.length 
        ? Math.floor(sessoes.reduce((acc, s) => acc + (s.tempo_total_segundos || 0), 0) / sessoes.length)
        : 0;

      setStats({
        totalVisualizacoes: totalVis,
        visitantesUnicos,
        totalMatriculas: totalMat,
        taxaConversao: visitantesUnicos > 0 ? (totalMat / visitantesUnicos) * 100 : 0,
        tempoMedioSessao: tempoMedio,
        carrinhoAbandonado: carrinhos?.length || 0,
      });

      // Buscar top cursos - com filtro de data
      const { data: cursosList } = await supabase.from("cursos").select("id, \"Nome dos cursos\"");
      
      const { data: todasVisualizacoes } = await supabase
        .from("curso_visualizacoes")
        .select("*")
        .gte('created_at', fromDate.toISOString())
        .lte('created_at', toDate.toISOString());
      console.log(`LOG: Todas visualizações para TopCursos: ${todasVisualizacoes?.length ?? 0}`);

      const { data: todasMatriculas } = await supabase
        .from("matriculas")
        .select("*")
        .gte('created_at', fromDate.toISOString())
        .lte('created_at', toDate.toISOString());
      console.log(`LOG: Todas matrículas para TopCursos: ${todasMatriculas?.length ?? 0}`);


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
        .gte('data_abandono', fromDate.toISOString())
        .lte('data_abandono', toDate.toISOString())
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
        .gte('created_at', fromDate.toISOString())
        .lte('created_at', toDate.toISOString())
        .order("created_at", { ascending: false })
        .limit(20);

      setLeadsExitIntent(leads || []);
      console.log("LOG: Busca de analytics finalizada.");
    } catch (error) {
      console.error("Erro ao buscar analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCursos = async () => {
    // Esta função não precisa de filtro de data, mas mantemos o log
    console.log("LOG: Buscando lista de cursos (para a aba 'Cursos')...");
    try {
      const { data, error } = await supabase
        .from("cursos")
        .select("*")
        .order("id", { ascending: false });

      if (error) throw error;
      setCursos(data || []);
      console.log(`LOG: ${data?.length ?? 0} cursos carregados para a aba.`);
    } catch (error: any) {
      toast.error("Erro ao carregar cursos");
      console.error(error);
    } finally {
      // O loading principal é controlado pelo fetchAnalytics
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col">
        <Navbar />

        <main className="container mx-auto px-4 py-8 flex-1">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
              <div>
                <h1 className="text-3xl font-bold mb-2">Painel Administrativo</h1>
                <p className="text-muted-foreground">
                  Gerencie cursos e acompanhe métricas de engajamento
                </p>
              </div>
              
              {/* --- FILTRO DE DATA --- */}
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="date"
                      variant={"outline"}
                      className={cn(
                        "w-full sm:w-[260px] justify-start text-left font-normal",
                        !dateRange && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange?.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "dd/MM/y", { locale: ptBR })} -{" "}
                            {format(dateRange.to, "dd/MM/y", { locale: ptBR })}
                          </>
                        ) : (
                          format(dateRange.from, "dd/MM/y", { locale: ptBR })
                        )
                      ) : (
                        <span>Selecione um período</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange?.from}
                      selected={dateRange}
                      onSelect={setDateRange}
                      numberOfMonths={2}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
                
                <Button onClick={handleFilterApply} className="w-full sm:w-auto">
                  Aplicar
                </Button>
                
                <Button className="gap-2 w-full sm:w-auto">
                  <Plus className="h-4 w-4" />
                  Novo Curso
                </Button>
              </div>
              {/* --- FIM FILTRO DE DATA --- */}

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
                {loading ? (
                   <div className="text-center py-12">
                     <div className="animate-pulse text-lg">Carregando analytics...</div>
                   </div>
                ) : (
                  <>
                    <DashboardStats {...stats} />

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <TopCourses cursos={topCursos} />
                      <AbandonedCarts carrinhos={carrinhosAbandonados} />
                    </div>

                    <LeadsExitIntent leads={leadsExitIntent} />
                  </>
                )}
              </TabsContent>

              <TabsContent value="cursos">
                {/* O loading da aba cursos é separado (e mais rápido) */}
                {cursos.length === 0 && loading ? (
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