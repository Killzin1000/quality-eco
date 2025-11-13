import { Link } from "react-router-dom";
import { Search, ShoppingCart, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

export const Navbar = () => {
  const [searchQuery, setSearchQuery] = useState("");

  return (
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

          {/* Desktop Search */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="search"
                placeholder="Buscar cursos..."
                className="pl-10 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
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
                <div className="relative w-full mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    type="search"
                    placeholder="Buscar cursos..."
                    className="pl-10 w-full"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
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
  );
};
