import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { CourseCard } from "@/components/CourseCard";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Filter, X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { toast } from "sonner";

interface Curso {
  id: number;
  "Nome dos cursos": string | null;
  Tipo: string | null;
  Modalidade: string | null;
  "Carga Horária": string | null;
  "Área de Atuação": string | null;
  "Preço Pix / Valor para Cadastro": string | null;
  "Preço Cartão / Valor para Cadastro": string | null;
  ImagemCapa: string | null;
  Polo: string | null;
}

const Courses = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("recent");
  
  // Filtros
  const [modalidadeFilter, setModalidadeFilter] = useState<string[]>([]);
  const [tipoFilter, setTipoFilter] = useState<string[]>([]);
  const [areaFilter, setAreaFilter] = useState<string[]>([]);

  useEffect(() => {
    // Carregar filtros da URL
    const modalidade = searchParams.get("modalidade");
    const tipo = searchParams.get("tipo");
    const area = searchParams.get("area");
    
    if (modalidade) setModalidadeFilter([modalidade]);
    if (tipo) setTipoFilter([tipo]);
    if (area) setAreaFilter([area]);
    
    fetchCursos();
  }, [searchParams]);

  const fetchCursos = async () => {
    try {
      setLoading(true);
      let query = supabase.from("cursos").select("*");

      // Aplicar filtros
      const modalidade = searchParams.get("modalidade");
      const tipo = searchParams.get("tipo");
      const area = searchParams.get("area");
      const search = searchParams.get("search");

      if (modalidade) {
        query = query.eq("Modalidade", modalidade);
      }
      if (tipo) {
        query = query.eq("Tipo", tipo);
      }
      if (area) {
        query = query.eq("Área de Atuação", area);
      }
      if (search) {
        query = query.ilike("Nome dos cursos", `%${search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setCursos(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar cursos");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filterType: string, value: string, checked: boolean) => {
    const params = new URLSearchParams(searchParams);
    
    if (checked) {
      params.set(filterType, value);
    } else {
      params.delete(filterType);
    }
    
    setSearchParams(params);
  };

  const clearFilters = () => {
    setSearchParams({});
    setModalidadeFilter([]);
    setTipoFilter([]);
    setAreaFilter([]);
  };

  const FilterContent = () => (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold mb-3">Modalidade</h3>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="ead"
              checked={searchParams.get("modalidade") === "EaD"}
              onCheckedChange={(checked) => handleFilterChange("modalidade", "EaD", checked as boolean)}
            />
            <Label htmlFor="ead" className="cursor-pointer">EaD</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="presencial"
              checked={searchParams.get("modalidade") === "Presencial"}
              onCheckedChange={(checked) => handleFilterChange("modalidade", "Presencial", checked as boolean)}
            />
            <Label htmlFor="presencial" className="cursor-pointer">Presencial</Label>
          </div>
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="font-semibold mb-3">Tipo de Curso</h3>
        <div className="space-y-2">
          {["Licenciatura", "2ª Licenciatura", "Pós-Graduação", "Segunda Graduação"].map((tipo) => (
            <div key={tipo} className="flex items-center space-x-2">
              <Checkbox
                id={tipo}
                checked={searchParams.get("tipo") === tipo}
                onCheckedChange={(checked) => handleFilterChange("tipo", tipo, checked as boolean)}
              />
              <Label htmlFor={tipo} className="cursor-pointer">{tipo}</Label>
            </div>
          ))}
        </div>
      </div>

      <Button variant="outline" onClick={clearFilters} className="w-full">
        <X className="mr-2 h-4 w-4" />
        Limpar filtros
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="container mx-auto px-4 py-8 flex-1">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Filtros Desktop */}
          <aside className="hidden md:block w-64 flex-shrink-0">
            <div className="sticky top-24 bg-card p-6 rounded-lg border border-border shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">Filtros</h2>
                <Filter className="h-5 w-5 text-muted-foreground" />
              </div>
              <FilterContent />
            </div>
          </aside>

          {/* Conteúdo Principal */}
          <div className="flex-1">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
              <div>
                <h1 className="text-3xl font-bold mb-2">Nossos Cursos</h1>
                <p className="text-muted-foreground">
                  {loading ? "Carregando..." : `${cursos.length} curso${cursos.length !== 1 ? "s" : ""} encontrado${cursos.length !== 1 ? "s" : ""}`}
                </p>
              </div>

              <div className="flex gap-2 w-full sm:w-auto">
                {/* Filtros Mobile */}
                <Sheet>
                  <SheetTrigger asChild className="md:hidden flex-1">
                    <Button variant="outline">
                      <Filter className="mr-2 h-4 w-4" />
                      Filtros
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left">
                    <SheetHeader>
                      <SheetTitle>Filtros</SheetTitle>
                    </SheetHeader>
                    <div className="mt-6">
                      <FilterContent />
                    </div>
                  </SheetContent>
                </Sheet>

                {/* Ordenação */}
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Mais recentes</SelectItem>
                    <SelectItem value="price-low">Menor preço</SelectItem>
                    <SelectItem value="price-high">Maior preço</SelectItem>
                    <SelectItem value="name">Nome (A-Z)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Grid de Cursos */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-96 bg-muted animate-pulse rounded-lg"></div>
                ))}
              </div>
            ) : cursos.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-xl text-muted-foreground mb-4">Nenhum curso encontrado</p>
                <Button onClick={clearFilters}>Limpar filtros</Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cursos.map((curso) => (
                  <CourseCard key={curso.id} curso={curso} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default Courses;
