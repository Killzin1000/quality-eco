import { Link, useNavigate } from "react-router-dom";
import { Search, ShoppingCart, Menu, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSearch } from "@/SearchProvider"; // <-- CORRIGIDO AQUI (removido o /context)

// Definindo o tipo para os resultados da busca
interface SearchResult {
  id: number;
  "Nome dos cursos": string | null;
}

export const Navbar = () => {
  const { openSearch, setOpenSearch } = useSearch(); 
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpenSearch(true);
        console.log("LOG (Navbar): Atalho Ctrl+K acionado, abrindo busca.");
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [setOpenSearch]);

  useEffect(() => {
    if (searchQuery.length < 3) {
      setResults([]);
      setLoading(false);
      return;
    }

    console.log(`LOG (Navbar): Query alterada: "${searchQuery}". Aguardando debounce...`);
    setLoading(true);

    const timer = setTimeout(() => {
      console.log(`LOG (Navbar): Debounce finalizado. Buscando no Supabase por: "${searchQuery}"`);
      
      const performSearch = async () => {
        try {
          const { data, error } = await supabase
            .from("cursos")
            .select('id, "Nome dos cursos"')
            .ilike('"Nome dos cursos"', `%${searchQuery}%`)
            .limit(5);

          if (error) throw error;
          
          console.log(`LOG (Navbar): Busca retornou ${data?.length || 0} resultados.`);
          setResults(data || []);

        } catch (error: any) {
          console.error("Erro ao buscar cursos:", error);
          toast.error("Erro ao realizar busca.");
        } finally {
          setLoading(false);
        }
      };

      performSearch();
    }, 300);

    return () => {
      console.log("LOG (Navbar): Limpando timer (usuário digitou novamente).");
      clearTimeout(timer);
    };
  }, [searchQuery]);

  const handleSelectResult = (id: number) => {
    console.log(`LOG (Navbar): Resultado ${id} selecionado. Navegando...`);
    navigate(`/curso/${id}`);
    setOpenSearch(false);
    setSearchQuery("");
  };

  return (
    <>
      <nav className="sticky top-0 z-50 bg-background border-b border-border shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg md:text-xl">QE</span>
              </div>
              <div className="hidden md:block">
                <h1 className="text-xl font-bold text-foreground">Quality Educacional</h1>
                <p className="text-xs text-muted-foreground">Invista no seu futuro</p>
              </div>
            </Link>

            {/* Desktop Search (gatilho) */}
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <Button
                variant="outline"
                className="w-full justify-start text-muted-foreground"
                onClick={() => {
                  console.log("LOG (Navbar): Botão de busca clicado.");
                  setOpenSearch(true)
                }}
              >
                <Search className="h-4 w-4 mr-2" />
                Buscar cursos...
                <kbd className="pointer-events-none ml-auto h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </Button>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              <Link to="/cursos" className="text-sm font-medium text-foreground hover:text-primary transition-smooth">
                Todos os Cursos
              </Link>
              <Link to="/cursos?modalidade=EaD" className="text-sm font-medium text-foreground hover:text-primary transition-smooth">
                EaD
              </Link>
              <Link to="/cursos?modalidade=Presencial" className="text-sm font-medium text-foreground hover:text-primary transition-smooth">
                Presenciais
              </Link>
              <Link to="/admin" className="text-sm font-medium text-foreground hover:text-primary transition-smooth">
                Admin
              </Link>
            </div>

            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <div className="flex flex-col space-y-4 mt-8">
                  {/* Mobile Search (gatilho) */}
                  <Button
                    variant="outline"
                    className="w-full justify-start text-muted-foreground"
                    onClick={() => {
                      console.log("LOG (Navbar Mobile): Botão de busca clicado.");
                      setOpenSearch(true)
                    }}
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Buscar cursos...
                  </Button>
                  
                  <Link to="/cursos" className="text-lg font-medium text-foreground hover:text-primary transition-smooth">
                    Todos os Cursos
                  </Link>
                  <Link to="/cursos?modalidade=EaD" className="text-lg font-medium text-foreground hover:text-primary transition-smooth">
                    Cursos EaD
                  </Link>
                  <Link to="/cursos?modalidade=Presencial" className="text-lg font-medium text-foreground hover:text-primary transition-smooth">
                    Cursos Presenciais
                  </Link>
                  <Link to="/admin" className="text-lg font-medium text-foreground hover:text-primary transition-smooth">
                    Painel Admin
                  </Link>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>

      {/* O Modal de Busca (CommandDialog) */}
      <CommandDialog open={openSearch} onOpenChange={setOpenSearch}>
        <CommandInput
          placeholder="Digite 3+ letras para buscar um curso..."
          value={searchQuery}
          onValueChange={setSearchQuery}
        />
        <CommandList>
          {loading && (
            <CommandEmpty>Buscando...</CommandEmpty>
          )}
          {!loading && !results.length && searchQuery.length >= 3 && (
            <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
          )}
           {!loading && !results.length && searchQuery.length < 3 && (
            <CommandEmpty>Digite ao menos 3 letras para iniciar a busca.</CommandEmpty>
          )}

          {!loading && results.length > 0 && (
            <CommandGroup heading="Cursos Encontrados">
              {results.map((curso) => (
                <CommandItem
                  key={curso.id}
                  onSelect={() => handleSelectResult(curso.id)}
                  value={curso["Nome dos cursos"] || `Curso ${curso.id}`}
                >
                  <BookOpen className="mr-2 h-4 w-4" />
                  <span>{curso["Nome dos cursos"]}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
};