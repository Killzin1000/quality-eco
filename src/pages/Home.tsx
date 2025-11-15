import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { CourseCard } from "@/components/CourseCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, GraduationCap, Monitor, Users, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useSearch } from "@/SearchProvider"; // <-- CORRIGIDO AQUI (removido o /context)

interface Curso {
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

const Home = () => {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [loading, setLoading] = useState(true);
  const { setOpenSearch } = useSearch();

  useEffect(() => {
    fetchCursos();
  }, []);

  const fetchCursos = async () => {
    console.log("LOG (Home): Buscando cursos em destaque...");
    try {
      const { data, error } = await supabase
        .from("cursos")
        .select("*")
        .limit(6);

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
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative gradient-hero text-primary-foreground py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnoiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLW9wYWNpdHk9Ii4wNSIgc3Ryb2tlLXdpZHRoPSIyIi8+PC9nPjwvc3ZnPg==')] opacity-10"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h1 className="text-4xl md:text-6xl font-bold leading-tight">
              Transforme seu futuro com educação de <span className="text-accent">qualidade</span>
            </h1>
            <p className="text-xl md:text-2xl text-primary-foreground/90">
              Cursos superiores EaD e presenciais reconhecidos pelo MEC
            </p>
            
            {/* Search Bar (gatilho) */}
            <div className="flex gap-2 max-w-2xl mx-auto">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar por curso ou área..."
                  className="pl-12 h-14 text-lg bg-background/95 backdrop-blur cursor-pointer"
                  onFocus={() => {
                    console.log("LOG (Home): Foco no input do Hero, abrindo busca.");
                    setOpenSearch(true);
                  }}
                  onClick={() => {
                    console.log("LOG (Home): Clique no input do Hero, abrindo busca.");
                    setOpenSearch(true);
                  }}
                  readOnly
                />
              </div>
              <Button 
                size="lg" 
                className="h-14 px-8 bg-accent hover:bg-accent-light text-accent-foreground font-semibold"
                onClick={() => {
                  console.log("LOG (Home): Botão 'Buscar' do Hero clicado, abrindo busca.");
                  setOpenSearch(true);
                }}
              >
                Buscar
              </Button>
            </div>


            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button size="lg" asChild variant="secondary" className="text-lg h-12">
                <Link to="/cursos">
                  Ver todos os cursos <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-secondary/50 border-y border-border">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <GraduationCap className="h-12 w-12 mx-auto mb-3 text-primary" />
              <p className="text-3xl font-bold text-foreground">50+</p>
              <p className="text-muted-foreground">Cursos disponíveis</p>
            </div>
            <div className="text-center">
              <Monitor className="h-12 w-12 mx-auto mb-3 text-primary" />
              <p className="text-3xl font-bold text-foreground">100% Online</p>
              <p className="text-muted-foreground">Estude de onde estiver</p>
            </div>
            <div className="text-center">
              <Users className="h-12 w-12 mx-auto mb-3 text-primary" />
              <p className="text-3xl font-bold text-foreground">10.000+</p>
              <p className="text-muted-foreground">Alunos matriculados</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Cursos em Destaque</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Conheça nossos cursos mais procurados e comece sua jornada educacional hoje
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-96 bg-muted animate-pulse rounded-lg"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cursos.map((curso) => (
                <CourseCard key={curso.id} curso={curso} />
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Button size="lg" asChild>
              <Link to="/cursos">
                Ver todos os cursos <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 md:py-24 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Cursos por Modalidade</h2>
            <p className="text-lg text-muted-foreground">Escolha a modalidade que melhor se adapta ao seu estilo de vida</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Link 
              to="/cursos?modalidade=EaD"
              className="group relative overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300"
            >
              <div className="aspect-video bg-gradient-to-br from-primary to-primary-glow p-8 flex flex-col justify-center items-center text-primary-foreground">
                <Monitor className="h-16 w-16 mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-2xl font-bold mb-2">Cursos EaD</h3>
                <p className="text-center text-primary-foreground/90">Flexibilidade total para estudar quando e onde quiser</p>
              </div>
            </Link>

            <Link 
              to="/cursos?modalidade=Presencial"
              className="group relative overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300"
            >
              <div className="aspect-video bg-gradient-to-br from-accent to-accent-light p-8 flex flex-col justify-center items-center text-accent-foreground">
                <GraduationCap className="h-16 w-16 mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-2xl font-bold mb-2">Cursos Presenciais</h3>
                <p className="text-center text-accent-foreground/90">Experiência completa com aulas presenciais</p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default Home;