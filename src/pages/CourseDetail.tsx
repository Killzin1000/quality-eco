import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Clock, BookOpen, MapPin, GraduationCap, FileText, 
  CheckCircle2, ExternalLink, Calendar, Users 
} from "lucide-react";
import { toast } from "sonner";
import { useAnalytics } from "@/hooks/useAnalytics";
import { CourseCard } from "@/components/CourseCard";
import { ExitIntentModal } from "@/components/ExitIntentModal"; // <-- ADICIONADO

interface Curso {
  id: number;
  "Nome dos cursos": string | null;
  Tipo: string | null;
  Modalidade: string | null;
  "Carga Horária": string | null;
  "Prazo de Conclusão": string | null;
  "Área de Atuação": string | null;
  "Pré Requesito para Matrícula": string | null;
  "Necessário Artigo?": string | null;
  "Necessário Estágio?": string | null;
  "Estuda Por / Contrato com": string | null;
  "Parceria Técnico Científica": string | null;
  "Link e-MEC Curso": string | null;
  "Tipo de Certificação": string | null;
  "Prazo Médio de Certificação": string | null;
  Ementa: string | null;
  "Preço Boleto / Valor para Cadastro": string | null;
  "Preço Cartão / Valor para Cadastro": string | null;
  "Preço Pix / Valor para Cadastro": string | null;
  Documentos: string | null;
  Polo: string | null;
  ImagemCapa: string | null;
}

interface CursoRelacionado {
  id: number;
  "Nome dos cursos": string | null;
  Tipo: string | null;
  Modalidade: string | null;
  "Carga Horária": string | null;
  "Preço Pix / Valor para Cadastro": string | null;
  "Preço Cartão / Valor para Cadastro": string | null;
  ImagemCapa: string | null;
  Polo: string | null;
}

const CourseDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [curso, setCurso] = useState<Curso | null>(null);
  const [cursosRelacionados, setCursosRelacionados] = useState<CursoRelacionado[]>([]);
  const [loading, setLoading] = useState(true);
  const { trackCourseView, updateViewDuration } = useAnalytics();
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    setCurso(null);
    setCursosRelacionados([]);
    setLoading(true);

    if (id) {
      console.log(`LOG: Novo ID de curso detectado: ${id}. Buscando dados...`);
      fetchCurso();
      
      trackCourseView(parseInt(id), new URLSearchParams(window.location.search).get("origem") || "direto");
    }

    const handleUnload = () => {
      if (id) {
        console.log("LOG: Usuário saindo da página. Registrando duração...");
        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
        updateViewDuration(parseInt(id), duration);
      }
    };
    
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      console.log("LOG: Componente desmontando ou ID mudando. Registrando duração.");
      if (id) {
        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
        updateViewDuration(parseInt(id), duration);
      }
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [id]);

  useEffect(() => {
    if (curso && curso["Área de Atuação"]) {
      console.log(`LOG: Curso principal carregado: ${curso["Nome dos cursos"]}. Buscando relacionados da área: ${curso["Área de Atuação"]}`);
      fetchCursosRelacionados(curso["Área de Atuação"], curso.id);
    } else if (curso) {
      console.log("LOG: Curso principal não tem 'Área de Atuação', não é possível buscar relacionados.");
    }
  }, [curso]);

  const fetchCurso = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("cursos")
        .select("*")
        .eq("id", parseInt(id!))
        .single();

      if (error) throw error;
      setCurso(data);
    } catch (error: any) {
      toast.error("Erro ao carregar curso");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCursosRelacionados = async (area: string, cursoId: number) => {
    try {
      const { data, error } = await supabase
        .from("cursos")
        .select(`
          id,
          "Nome dos cursos",
          Tipo,
          Modalidade,
          "Carga Horária",
          "Preço Pix / Valor para Cadastro",
          "Preço Cartão / Valor para Cadastro",
          ImagemCapa,
          Polo
        `)
        .eq("Área de Atuação", area)
        .neq("id", cursoId)
        .limit(3);

      if (error) throw error;
      
      console.log(`LOG: Cursos relacionados encontrados: ${data?.length || 0}`);
      setCursosRelacionados(data || []);
    } catch (error: any) {
      console.error("Erro ao buscar cursos relacionados:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-pulse text-lg">Carregando...</div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!curso) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Curso não encontrado</h2>
            <Button asChild>
              <Link to="/cursos">Ver todos os cursos</Link>
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Passamos o nome do curso para o modal de saída */}
      <ExitIntentModal courseName={curso["Nome dos cursos"] || undefined} />
      
      <Navbar />

      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Coluna Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Imagem e Título */}
            <div>
              <div className="relative aspect-video bg-muted rounded-lg overflow-hidden mb-6">
                {curso.ImagemCapa ? (
                  <img
                    src={curso.ImagemCapa}
                    alt={curso["Nome dos cursos"] || "Curso"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary to-primary-glow">
                    <BookOpen className="h-24 w-24 text-primary-foreground/50" />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                {curso.Tipo && (
                  <p className="text-sm text-accent font-semibold uppercase">{curso.Tipo}</p>
                )}
                <h1 className="text-3xl md:text-4xl font-bold">{curso["Nome dos cursos"]}</h1>
                
                <div className="flex flex-wrap gap-2 pt-2">
                  {curso.Modalidade && (
                    <Badge variant={curso.Modalidade === "EaD" ? "default" : "secondary"}>
                      {curso.Modalidade}
                    </Badge>
                  )}
                  {curso["Área de Atuação"] && (
                    <Badge variant="outline">{curso["Área de Atuação"]}</Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Informações Rápidas */}
            <Card>
              <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6">
                {curso["Carga Horária"] && (
                  <div className="text-center">
                    <Clock className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <p className="text-sm font-medium">{curso["Carga Horária"]}</p>
                    <p className="text-xs text-muted-foreground">Carga horária</p>
                  </div>
                )}
                {curso["Prazo de Conclusão"] && (
                  <div className="text-center">
                    <Calendar className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <p className="text-sm font-medium">{curso["Prazo de Conclusão"]}</p>
                    <p className="text-xs text-muted-foreground">Duração</p>
                  </div>
                )}
                {curso["Tipo de Certificação"] && (
                  <div className="text-center">
                    <GraduationCap className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <p className="text-sm font-medium">{curso["Tipo de Certificação"]}</p>
                    <p className="text-xs text-muted-foreground">Certificação</p>
                  </div>
                )}
                {curso.Polo && (
                  <div className="text-center">
                    <MapPin className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <p className="text-sm font-medium line-clamp-1">{curso.Polo}</p>
                    <p className="text-xs text-muted-foreground">Polo</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tabs de Informações */}
            <Card>
              <CardContent className="p-6">
                <Tabs defaultValue="sobre" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="sobre">Sobre</TabsTrigger>
                    <TabsTrigger value="requisitos">Requisitos</TabsTrigger>
                    <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="sobre" className="space-y-4 mt-4">
                    <div>
                      <h3 className="font-semibold mb-2">Sobre o Curso</h3>
                      <p className="text-muted-foreground">
                        {curso.Ementa || "Informações sobre o curso em breve."}
                      </p>
                    </div>
                    
                    {curso["Estuda Por / Contrato com"] && (
                      <div>
                        <h3 className="font-semibold mb-2">Instituição Parceira</h3>
                        <p className="text-muted-foreground">{curso["Estuda Por / Contrato com"]}</p>
                      </div>
                    )}

                    {curso["Parceria Técnico Científica"] && (
                      <div>
                        <h3 className="font-semibold mb-2">Parceria Técnico-Científica</h3>
                        <p className="text-muted-foreground">{curso["Parceria Técnico Científica"]}</p>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="requisitos" className="space-y-4 mt-4">
                    {curso["Pré Requesito para Matrícula"] && (
                      <div>
                        <h3 className="font-semibold mb-2">Pré-requisitos</h3>
                        <p className="text-muted-foreground">{curso["Pré Requesito para Matrícula"]}</p>
                      </div>
                    )}

                    {curso.Documentos && (
                      <div>
                        <h3 className="font-semibold mb-2">Documentos Necessários</h3>
                        <p className="text-muted-foreground whitespace-pre-line">{curso.Documentos}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 pt-4">
                      <div className="flex items-center space-x-2">
                        {curso["Necessário Artigo?"] === "Sim" ? (
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                        ) : (
                          <div className="h-5 w-5 rounded-full border-2 border-muted-foreground" />
                        )}
                        <span className="text-sm">Necessário Artigo</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {curso["Necessário Estágio?"] === "Sim" ? (
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                        ) : (
                          <div className="h-5 w-5 rounded-full border-2 border-muted-foreground" />
                        )}
                        <span className="text-sm">Necessário Estágio</span>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="detalhes" className="space-y-4 mt-4">
                    {curso["Prazo Médio de Certificação"] && (
                      <div>
                        <h3 className="font-semibold mb-2">Prazo de Certificação</h3>
                        <p className="text-muted-foreground">{curso["Prazo Médio de Certificação"]}</p>
                      </div>
                    )}

                    {curso["Link e-MEC Curso"] && (
                      <div>
                        <h3 className="font-semibold mb-2">Reconhecimento MEC</h3>
                        <a 
                          href={curso["Link e-MEC Curso"]} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center text-primary hover:underline"
                        >
                          Verificar no e-MEC <ExternalLink className="ml-2 h-4 w-4" />
                        </a>
                      </div>
                    )}

                    {curso.Ementa && (
                      <div>
                        <h3 className="font-semibold mb-2">Ementa Completa</h3>
                        <Button variant="outline" asChild>
                          <a href={curso.Ementa} target="_blank" rel="noopener noreferrer">
                            <FileText className="mr-2 h-4 w-4" />
                            Ver ementa completa
                          </a>
                        </Button>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {cursosRelacionados.length > 0 && (
              <div className="pt-8">
                <h2 className="text-2xl font-bold mb-6">Quem viu este, viu também</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {cursosRelacionados.map((cursoRelacionado) => (
                    <CourseCard 
                      key={cursoRelacionado.id} 
                      curso={cursoRelacionado as any} 
                    />
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Sidebar - Preços e CTA */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              <Card className="shadow-lg">
                <CardContent className="p-6 space-y-4">
                  <h3 className="font-semibold text-lg">Invista no seu futuro</h3>
                  
                  <Tabs defaultValue="pix" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="pix">Pix</TabsTrigger>
                      <TabsTrigger value="cartao">Cartão</TabsTrigger>
                      <TabsTrigger value="boleto">Boleto</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="pix" className="pt-4">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground mb-2">À vista no Pix</p>
                        <p className="text-3xl font-bold text-primary">
                          {curso["Preço Pix / Valor para Cadastro"] || "Consulte"}
                        </p>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="cartao" className="pt-4">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground mb-2">No Cartão</p>
                        <p className="text-3xl font-bold text-primary">
                          {curso["Preço Cartão / Valor para Cadastro"] || "Consulte"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">Parcelamento disponível</p>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="boleto" className="pt-4">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground mb-2">No Boleto</p>
                        <p className="text-3xl font-bold text-primary">
                          {curso["Preço Boleto / Valor para Cadastro"] || "Consulte"}
                        </p>
                      </div>
                    </TabsContent>
                  </Tabs>

                  <Separator />

                  <Button size="lg" className="w-full bg-accent hover:bg-accent-light text-accent-foreground font-semibold" asChild>
                    <Link to={`/checkout/${curso.id}`}>
                      Matricular-se agora
                    </Link>
                  </Button>

                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">
                      ✓ Certificado reconhecido pelo MEC<br />
                      ✓ Suporte especializado<br />
                      ✓ Material didático incluso
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h4 className="font-semibold mb-4">Dúvidas?</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Entre em contato com nossa equipe pelo WhatsApp
                  </p>
                  <Button variant="outline" className="w-full" onClick={() => {
                    const phone = "5511987654321";
                    const message = encodeURIComponent(`Olá! Tenho interesse no curso: ${curso["Nome dos cursos"]}`);
                    window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
                  }}>
                    <Users className="mr-2 h-4 w-4" />
                    Falar com consultor
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <WhatsAppButton 
        courseContext={curso ? { id: curso.id, nome: curso["Nome dos cursos"] } : undefined} 
      />
    </div>
  );
};

export default CourseDetail;